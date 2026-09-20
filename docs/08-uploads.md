# 08. Загрузка и хранение файлов

## Назначение
Картинки для типов `grid3x3`, `tiles`, `slider`, `imageCode` и аудиофайлы для `audio`. Хранятся локально в `data/uploads/`.

## Эндпоинт
`POST /api/admin/uploads` (см. `04-rest-api.md`). Multipart, поле `file`.

## Ограничения

| параметр                 | значение |
|--------------------------|----------|
| Максимальный размер     | 5 МБ (`UPLOAD_MAX_BYTES`) |
| Допустимые MIME (image) | `image/jpeg`, `image/png`, `image/webp` |
| Допустимые MIME (audio) | `audio/mpeg`, `audio/ogg`, `audio/wav` |
| Макс. разрешение картинки | 1600 × 1600 (ресайз через sharp) |
| Длина аудио             | до 60 с (валидация по размеру и опционально через `ffprobe`, в MVP — только по размеру) |

При превышении — `413` / `400 validation`.

## Поток обработки (`routes/uploadRoutes.js`)

1. Получить multipart-поток.
2. Прочитать в `Buffer` с ограничением размера.
3. Определить категорию по MIME:
   - **image:** прогон через `utils/image.js → processImage(buffer)`:
     - `sharp(buf).rotate()` (учесть EXIF orientation),
     - `.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })`,
     - `.toFormat('jpeg' | 'png' | 'webp', { quality: 85 })` (сохраняем оригинальный формат),
     - `.toBuffer({ resolveWithObject: true })` → получаем `{ data, info: { width, height, format } }`.
   - **audio:** не обрабатываем, пишем как есть.
4. Сгенерировать имя: `<uuidv4>.<ext>`.
5. Записать на диск: `data/uploads/<filename>` (атомарно: `writeFile` в `<filename>.tmp` → `rename`).
6. Вставить запись в `uploads`.
7. Вернуть `{ filename, url, mime, size, width?, height? }`.

## Отдача файлов
Через `@fastify/static`:
```js
fastify.register(fastifyStatic, {
  root: path.join(DATA_DIR, 'uploads'),
  prefix: '/uploads/',
  immutable: true,
  maxAge: '30d',
});
```
В prod — лучше отдавать nginx-ом напрямую с `/data/uploads` (см. `10-deployment.md`), Fastify оставляем как fallback в dev.

## Orphan-файлы
Не удаляем автоматически. Раз в неделю руками или скриптом `server/scripts/cleanup-uploads.js`:
- собрать все `assetUrl`/`audioUrl`/`backgroundUrl`/`objectUrl` из `payload` всех вопросов,
- сравнить с файлами в `data/uploads/`,
- удалить незадействованные старше 7 дней.

Для MVP скрипт необязателен — диска 10 ГБ хватит.

## Безопасность
- Не доверять `Content-Type` от клиента — проверять буфер первыми байтами (magic numbers) через `file-type` библиотеку или хотя бы базовые сигнатуры (`FF D8` для jpeg, `89 50 4E 47` для png).
- Имена файлов генерируются на сервере (uuid), оригинальное имя не используем.
- `/uploads/` отдаёт только файлы; листинг директорий выключен.
- CSP/X-Content-Type-Options через nginx.
