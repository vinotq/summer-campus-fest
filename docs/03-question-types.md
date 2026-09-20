# 03. Типы капч: payload и проверка

Каждый вопрос в БД имеет `type` и `payload` (JSON). Формат `payload` строго описан ниже. Сервер при создании/обновлении вопроса валидирует `payload` через `game/questionTypes.js`.

Игроку отдаётся **`publicView`** — урезанная версия `payload` без правильных ответов.

Все `assetUrl` — относительные пути вида `/uploads/<filename>`.

---

## 1. `grid3x3` — выбрать правильные фото из 9

### payload (в БД)
```json
{
  "tiles": [
    { "assetUrl": "/uploads/a.jpg", "correct": true  },
    { "assetUrl": "/uploads/b.jpg", "correct": false },
    ...9 элементов...
  ]
}
```

### publicView (игроку)
```json
{
  "type": "grid3x3",
  "title": "Выберите просроченные продукты",
  "tiles": [
    { "index": 0, "assetUrl": "/uploads/a.jpg" },
    ...
  ]
}
```

### answerData (от игрока)
```json
{ "selected": [0, 2, 5] }
```

### Правило проверки
Множество выбранных индексов **точно равно** множеству индексов с `correct: true`.

---

## 2. `tiles` — выбрать клетки на одном фото

### payload
```json
{
  "assetUrl": "/uploads/photo.jpg",
  "grid": { "cols": 4, "rows": 4 },
  "correctCells": [3, 7, 10]
}
```
Индексация ячеек — слева-направо, сверху-вниз, начиная с 0.

### publicView
```json
{
  "type": "tiles",
  "title": "Выберите все правильно припаркованные велосипеды",
  "assetUrl": "/uploads/photo.jpg",
  "grid": { "cols": 4, "rows": 4 }
}
```

### answerData
```json
{ "selected": [3, 7, 10] }
```

### Правило проверки
Множества равны.

---

## 3. `slider` — расположить объект в точке

### payload
```json
{
  "backgroundUrl": "/uploads/bg.jpg",
  "objectUrl": "/uploads/key.png",
  "target":   { "x": 0.72, "y": 0.41 },
  "tolerance": 0.05,
  "axis": "both"
}
```
- `x`, `y` — нормированы к [0, 1] относительно ширины/высоты фона.
- `tolerance` — допустимое расстояние (евклидово) в той же нормировке.
- `axis`: `"both"` | `"x"` | `"y"` — иногда задача одномерная (только по горизонтали).

### publicView
```json
{
  "type": "slider",
  "title": "Поставьте пылесос в подъезде",
  "backgroundUrl": "/uploads/bg.jpg",
  "objectUrl": "/uploads/key.png",
  "axis": "both"
}
```
**Цель и tolerance не отдаём.**

### answerData
```json
{ "x": 0.70, "y": 0.43 }
```

### Правило проверки
- `axis="both"`: `sqrt((x-tx)^2 + (y-ty)^2) <= tolerance`.
- `axis="x"`: `|x-tx| <= tolerance`.
- `axis="y"`: `|y-ty| <= tolerance`.

---

## 4. `audio` — транскрибировать

### payload
```json
{
  "audioUrl": "/uploads/track.mp3",
  "expected": "внимание эвакуация",
  "matching": {
    "mode": "exact",
    "caseSensitive": false,
    "maxDistance": 2
  }
}
```
- `mode`: `"exact"` (после нормализации) | `"levenshtein"` (с `maxDistance`).
- Нормализация (`utils/normalizeText.js`): trim, collapse spaces, NFKC, lower (если `!caseSensitive`), удаление знаков препинания.

### publicView
```json
{
  "type": "audio",
  "title": "Что вы слышите? Перепишите ровно так, как звучит",
  "audioUrl": "/uploads/track.mp3"
}
```

### answerData
```json
{ "text": "внимание, эвакуация" }
```

### Правило проверки
- Нормализуем обе строки.
- `exact`: строгое равенство.
- `levenshtein`: `dist(a,b) <= maxDistance`.

---

## 5. `imageCode` — ввести код с искажённого фото

В MVP **админ загружает уже готовую картинку** с кодом. Авто-генерация искажений — опциональная фича на потом.

### payload
```json
{
  "assetUrl": "/uploads/code123.png",
  "expected": "K7Q9",
  "matching": {
    "caseSensitive": false,
    "maxDistance": 0
  }
}
```

### publicView
```json
{
  "type": "imageCode",
  "title": "Введите код с картинки",
  "assetUrl": "/uploads/code123.png"
}
```

### answerData
```json
{ "text": "k7q9" }
```

### Правило проверки
Аналогично `audio`: нормализация + exact/levenshtein.

---

## Валидация payload в редакторе

`game/questionTypes.js` экспортирует:
```js
{
  grid3x3:  { validate(payload), publicView(payload), check(payload, answerData) },
  tiles:    { ... },
  slider:   { ... },
  audio:    { ... },
  imageCode:{ ... },
}
```

`validate` бросает ошибку с понятным сообщением — оно уходит админу в ответе на 400.

Примеры правил валидации:
- `grid3x3`: ровно 9 tiles, у каждой непустой `assetUrl`, есть хотя бы один `correct:true`.
- `tiles`: `cols`/`rows` в [2, 6], `correctCells` непуст, все индексы в диапазоне.
- `slider`: `target.x`/`y` в [0,1], `tolerance` в (0, 0.5].
- `audio`/`imageCode`: непустой `expected`, `maxDistance >= 0`.

Все `assetUrl` должны существовать в таблице `uploads` (опциональная проверка).
