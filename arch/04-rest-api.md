# 04. HTTP API

База: `/api`. Формат тел запросов и ответов — JSON, кроме multipart-аплоада. Ошибки — `{ "error": "<code>", "message": "<human>" }`.

Коды ошибок: `unauthorized`, `forbidden`, `not_found`, `validation`, `conflict`, `session_finished`, `already_answered`, `internal`.

---

## Публичная часть (игрок)

### `POST /api/start`
Создание игровой сессии. Ставит cookie `cf_sid` (HMAC-подписанный).

**Запрос:**
```json
{ "lastName": "Иванов", "firstName": "Пётр", "fingerprint": "abc123" }
```
`fingerprint` опционален.

**Ответ 201:**
```json
{
  "sessionId": "f47ac10b-...",
  "totalQuestions": 7,
  "startedAt": 1730000000000
}
```

**Ошибки:**
- `400 validation` — пустые `lastName`/`firstName` или > 64 символов.
- `409 conflict` — у клиента уже активная сессия (по cookie). Возвращаем существующий `sessionId`.

### `GET /api/session/current`
Возвращает текущий вопрос игроку. Требует cookie `cf_sid`.

**Ответ 200 (есть вопрос):**
```json
{
  "status": "in_progress",
  "progress": { "index": 2, "total": 7 },
  "question": {
    "id": 42,
    "type": "grid3x3",
    "title": "Выберите просроченные продукты",
    "timeLimitMs": 30000,
    "startedAt": 1730000050000,
    "publicView": { /* зависит от type, см. 03-question-types.md */ }
  }
}
```

**Ответ 200 (сессия завершена):**
```json
{
  "status": "finished",
  "result": {
    "totalScore": 540,
    "answers": [
      { "questionId": 42, "correct": true, "score": 80, "elapsedMs": 12000 },
      ...
    ],
    "rank": 3
  }
}
```

**Ошибки:** `401 unauthorized` — нет/невалидная cookie.

### `POST /api/session/answer`
Отправка ответа на текущий вопрос.

**Запрос:**
```json
{
  "questionId": 42,
  "answerData": { /* см. 03-question-types.md */ }
}
```

**Ответ 200:**
```json
{
  "correct": true,
  "score": 80,
  "elapsedMs": 12000,
  "next": "question"   // или "finished"
}
```

**Ошибки:**
- `401 unauthorized`.
- `409 already_answered` — на этот вопрос уже отвечали.
- `409 session_finished` — сессия завершена.
- `400 validation` — `questionId` не совпадает с текущим, либо `answerData` не проходит проверку формата.

### `GET /api/session/result`
Идемпотентная финальная сводка. Сразу можно дёргать для рендера «сертификата».

**Ответ 200:** как `current` в статусе `finished`.

---

## Админ

Все эндпоинты требуют cookie `cf_admin`. Иначе `401 unauthorized`.

### `POST /api/admin/login`
**Запрос:** `{ "login": "...", "password": "..." }`
**Ответ 200:** `{ "ok": true }` + ставит cookie.
**Ошибки:** `401 unauthorized`.

### `POST /api/admin/logout`
Чистит cookie. `200 { "ok": true }`.

### `GET /api/admin/me`
`200 { "login": "..." }` или `401`.

### Вопросы

#### `GET /api/admin/questions`
```json
{
  "questions": [
    {
      "id": 1, "type": "grid3x3", "title": "...",
      "baseScore": 100, "timeLimitMs": 30000,
      "active": true, "orderIndex": 0,
      "payload": { ... }
    }
  ]
}
```

#### `POST /api/admin/questions`
**Запрос:**
```json
{
  "type": "grid3x3",
  "title": "Выберите просроченные продукты",
  "baseScore": 100,
  "timeLimitMs": 30000,
  "active": true,
  "payload": { /* по типу */ }
}
```
**Ответ 201:** `{ "question": { ... } }`. Эмитит `questions:changed` админам.

#### `PATCH /api/admin/questions/:id`
Принимает любые поля частично. При смене `type` требует полный новый `payload`.

#### `PATCH /api/admin/questions/:id/active`
**Запрос:** `{ "active": false }`. Удобный отдельный эндпоинт.

#### `PUT /api/admin/questions/reorder`
**Запрос:** `{ "ids": [3, 1, 2, ...] }` — новый порядок. Обновляет `order_index`.

**Удаления нет** — только `active=false`.

### Игроки

#### `GET /api/admin/sessions`
```json
{
  "sessions": [
    {
      "id": "uuid",
      "lastName": "...", "firstName": "...",
      "startedAt": 1730000000000,
      "finishedAt": null,
      "totalScore": 0,
      "progress": { "answered": 3, "total": 7 },
      "hiddenFromDashboard": false
    }
  ]
}
```
Сортировка: активные первыми, потом по `startedAt DESC`.

#### `PATCH /api/admin/sessions/:id/visibility`
**Запрос:** `{ "hiddenFromDashboard": true }`.
Эмитит `top:update` дашборду.

### Аплоады

#### `POST /api/admin/uploads`
`multipart/form-data`, поле `file`. Ограничение: 5 МБ, типы: `image/jpeg|png|webp`, `audio/mpeg|ogg|wav`.

**Ответ 201:**
```json
{
  "filename": "9f8e2c-...png",
  "url": "/uploads/9f8e2c-...png",
  "mime": "image/png",
  "size": 234120,
  "width": 1200,
  "height": 800
}
```

### Дашборд

#### `GET /api/dashboard/top`
Публичный эндпоинт (без cookie). Для первой загрузки экрана-дашборда.
```json
{
  "top": [
    { "rank": 1, "sessionId": "...", "name": "Иванов П.", "totalScore": 880, "finishedAt": ... },
    ...
  ]
}
```
Формат отображаемого имени: `<Фамилия> <Инициал>.` (формируем на бэке).
