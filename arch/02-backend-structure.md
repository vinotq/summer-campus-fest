# 02. Пофайловая структура бэкенда

Корень: `server/`. Все пути ниже — относительно него.

```
server/
├── package.json
├── .eslintrc.json
├── src/
│   ├── index.js
│   ├── config.js
│   ├── app.js
│   ├── db/
│   │   ├── client.js
│   │   ├── schema.sql
│   │   └── repo/
│   │       ├── questions.js
│   │       ├── sessions.js
│   │       ├── answers.js
│   │       └── uploads.js
│   ├── auth/
│   │   ├── adminAuth.js
│   │   └── playerSession.js
│   ├── routes/
│   │   ├── publicRoutes.js
│   │   ├── adminRoutes.js
│   │   └── uploadRoutes.js
│   ├── realtime/
│   │   ├── io.js
│   │   ├── adminChannel.js
│   │   └── dashboardChannel.js
│   ├── game/
│   │   ├── scoring.js
│   │   ├── questionTypes.js
│   │   ├── checker.js
│   │   └── sessionFlow.js
│   └── utils/
│       ├── ids.js
│       ├── hmac.js
│       ├── normalizeText.js
│       ├── image.js
│       └── logger.js
└── data/                  # симлинк/маунт на /data
```

## Назначение файлов

### Корень

- **`package.json`** — зависимости: `fastify`, `@fastify/cookie`, `@fastify/multipart`, `@fastify/static`, `@fastify/cors`, `socket.io`, `better-sqlite3`, `sharp`, `uuid`, `dotenv`. Dev: `nodemon`, `eslint`.

### `src/index.js`
Точка входа. Загружает `.env`, создаёт приложение через `app.js`, слушает порт. Обработка graceful shutdown (закрытие БД, socket.io).

### `src/config.js`
Чтение и валидация переменных окружения, экспорт констант:
```js
{
  port, host,
  dbPath, uploadsDir,
  adminLogin, adminPasswordHash,
  cookieSecret,
  sessionCookieName: 'cf_sid',
  adminCookieName:   'cf_admin',
  uploadMaxBytes: 5 * 1024 * 1024,
}
```

### `src/app.js`
Сборка Fastify-инстанса:
1. Регистрирует `@fastify/cookie`, `@fastify/multipart`, `@fastify/cors`, `@fastify/static` (для `/uploads`).
2. Подключает БД (`db/client.js`) и накатывает схему.
3. Регистрирует роуты: `publicRoutes`, `adminRoutes`, `uploadRoutes`.
4. Подключает Socket.IO к HTTP-серверу Fastify.
5. Возвращает `{ fastify, io }`.

### `src/db/client.js`
Создаёт `better-sqlite3` инстанс, включает прагмы (см. `01-database.md`), исполняет `schema.sql`. Экспортирует singleton `db`.

### `src/db/schema.sql`
DDL всех таблиц и индексов из `01-database.md`. Idempotent.

### `src/db/repo/*.js`
Каждый репозиторий — набор подготовленных стейтментов (`db.prepare(...)`) и функций-обёрток. Никакого ORM.

- **`questions.js`** — `list()`, `listActive()`, `getById(id)`, `create(data)`, `update(id, data)`, `setActive(id, bool)`, `reorder(ids)`.
- **`sessions.js`** — `create({lastName, firstName, fingerprint, questionIdsSnapshot})`, `getById(id)`, `listAll()`, `listTop(limit)`, `setHidden(id, bool)`, `advanceIndex(id)`, `finish(id, totalScore)`.
- **`answers.js`** — `insert(...)`, `existsForSession(sessionId, questionId)`, `listBySession(sessionId)`, `sumScoreForSession(sessionId)`.
- **`uploads.js`** — `insert({filename, mime, size, width, height})`, `getByFilename(name)`.

### `src/auth/adminAuth.js`
- `hashPassword(plain)` — bcrypt-like (используем встроенный `crypto.scrypt` для отсутствия лишних зависимостей).
- `verifyPassword(plain, hash)`.
- `issueCookie(reply)` — ставит подписанный HMAC-токен в `cf_admin`.
- `requireAdmin(request, reply)` — preHandler: проверяет cookie, иначе 401.

### `src/auth/playerSession.js`
- `issueSessionCookie(reply, sessionId)` — подписанный токен в `cf_sid`, httpOnly, `SameSite=Lax`, срок жизни 2 ч.
- `getSessionId(request)` — извлекает из cookie, проверяет подпись.
- `requirePlayer(request, reply)` — preHandler: проверяет, что сессия существует и не финализирована.

### `src/routes/publicRoutes.js`
Эндпоинты для игрока (контракты — в `04-rest-api.md`). Использует `playerSession.js` и `game/sessionFlow.js`.

### `src/routes/adminRoutes.js`
Эндпоинты для админа. Все обёрнуты `requireAdmin`. Использует репозитории и `questionTypes.js` для валидации payload.

### `src/routes/uploadRoutes.js`
`POST /api/admin/uploads` — приём multipart, обработка через `utils/image.js` (resize/strip), запись на диск, регистрация в `uploads`.
Сама отдача файлов — через `@fastify/static` на `/uploads/*`, без проверки прав (картинки публичные).

### `src/realtime/io.js`
Инициализация Socket.IO с CORS-настройками. Регистрирует middleware для:
- комнаты `admin` (проверка `cf_admin` cookie через `adminAuth`),
- комнаты `dashboard` (без аутентификации, read-only),
- комнаты `player:<sessionId>` (на будущее, для серверных таймеров; в MVP можно не использовать).

### `src/realtime/adminChannel.js`
Эмиттеры событий `players:update`, `players:new`, `players:finished`, `questions:changed` (см. `05-realtime.md`).

### `src/realtime/dashboardChannel.js`
Эмиттер `top:update` (топ-10 при изменении).

### `src/game/scoring.js`
```js
function score({ baseScore, timeLimitMs, elapsedMs, correct }) {
  if (!correct) return 0;
  const ratio = Math.max(0.2, 1 - elapsedMs / timeLimitMs);
  return Math.round(baseScore * ratio);
}
```

### `src/game/questionTypes.js`
Реестр типов: для каждого типа — `validatePayload(payload)`, `publicView(payload)` (то, что отдаём игроку — без правильных ответов). См. `03-question-types.md`.

### `src/game/checker.js`
Сверка ответа игрока с правильным. Для каждого типа — своя функция. Возвращает `boolean`.

### `src/game/sessionFlow.js`
- `startSession({lastName, firstName, fingerprint})` — фиксирует snapshot активных вопросов, создаёт запись, возвращает `sessionId`.
- `getCurrentQuestion(sessionId)` — отдаёт текущий вопрос игроку в `publicView` + `startedAt` для таймера.
- `submitAnswer(sessionId, questionId, answerData)` — сверка, скоринг, запись в `answers`, продвижение указателя; если вопросов больше нет — финализация.
- `finishSession(sessionId)` — сумма очков, проставление `finished_at`, эмит событий админу/дашборду.

### `src/utils/*`
- **`ids.js`** — генерация uuid v4.
- **`hmac.js`** — подпись/проверка строк через `crypto.createHmac('sha256', secret)`. Используется для cookie-токенов.
- **`normalizeText.js`** — `normalize(str)` (трим, lower, NFKC), `levenshtein(a, b)`. Для аудио-капчи и imageCode.
- **`image.js`** — sharp: `processUpload(buffer, mime)` → ресайз до 1600×1600 max, конвертация в jpeg/png, возвращает `{buffer, width, height}`.
- **`logger.js`** — обёртка над `pino` или `console` (минимально — `info`/`warn`/`error` с timestamp).
