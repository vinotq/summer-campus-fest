# 06. Авторизация

Два независимых контекста: **админ** и **игрок**. Оба — через httpOnly cookie с HMAC-подписанным токеном. Без JWT, без сессий в БД.

## Общий механизм подписи (`utils/hmac.js`)

```js
sign(payload)  → `${payloadB64}.${hmacSha256(payloadB64, SECRET)}`
verify(token)  → payload | null
```
- `payload` — JSON-объект, кодируется в base64url.
- `SECRET` — `COOKIE_SECRET` из `.env`, минимум 32 символа.

Cookie ставятся с флагами: `HttpOnly`, `SameSite=Lax`, `Secure` (если запрос пришёл по https), `Path=/`.

---

## Админ

### Конфигурация
В `.env`:
```
ADMIN_LOGIN=admin
ADMIN_PASSWORD_HASH=<scrypt-hash>
COOKIE_SECRET=<32+ символа>
```

Хэш генерируется одноразовой утилитой `server/scripts/hash-password.js`:
```bash
node scripts/hash-password.js 'мойпароль'
# → выводит строку для вставки в .env
```

Используем встроенный `crypto.scryptSync` + соль (соль хранится в самом хэше: `scrypt$<saltB64>$<keyB64>`).

### Логин
1. `POST /api/admin/login { login, password }`.
2. `verifyPassword(password, ADMIN_PASSWORD_HASH)`. Сравнение хэшей — через `crypto.timingSafeEqual`.
3. При совпадении логина и пароля: `reply.setCookie('cf_admin', sign({ kind: 'admin', iat: Date.now() }), { maxAge: 12*3600 })`.
4. При неуспехе — `401`. Задержка 200–500 мс (защита от тайминга/брутфорса).

### Проверка (`requireAdmin`)
preHandler-функция:
```js
const token = req.cookies.cf_admin;
const payload = verify(token);
if (!payload || payload.kind !== 'admin') return reply.code(401).send({ error: 'unauthorized' });
if (Date.now() - payload.iat > 12*3600*1000) return reply.code(401).send({ error: 'unauthorized' });
```

### Логаут
`POST /api/admin/logout` → `reply.clearCookie('cf_admin')`.

### Rate limit на `/api/admin/login`
Простой in-memory: не более 10 неуспешных попыток за 5 минут с одного IP. Реализация в `routes/adminRoutes.js`.

---

## Игрок

### Создание
`POST /api/start` создаёт запись в `sessions`, генерирует `sessionId` (uuid v4), ставит:
```
cf_sid = sign({ kind: 'player', sid: sessionId, iat: Date.now() })
```
`maxAge`: 2 часа (с запасом на самую долгую сессию).

### Проверка (`requirePlayer`)
- Читаем cookie, верифицируем подпись.
- Достаём `sessions` по `sid`, если нет — `401`.
- Иначе кладём `req.session = row`.

### Защита «нельзя пройти дважды»
1. **Cookie-флаг:** при финализации сессии cookie остаётся валидной (статус `finished`). При повторном заходе клиент видит финальный экран, а не старт.
2. **localStorage** на фронте: ключ `cf_played = '1'` после финиша. Фронт при заходе на `/` проверяет: если есть — редирект на `/result`.
3. **fingerprint** (опционально): `client_fingerprint` записываем в `sessions`. При новом `POST /api/start` сервер ищет существующую финализированную сессию с тем же fingerprint и возвращает её результат вместо создания новой.

Это **мягкая защита**: обходится очисткой данных браузера или режимом инкогнито. Жёсткий контроль — за админом через список игроков.

### Анти-чит мелочи
- Сервер записывает `started_at` вопроса в момент **первого** ответа `GET /api/session/current` для этого `question_id` (закрепляется в БД). Повторный `GET` не сбрасывает таймер.
- Сервер считает `elapsedMs = Date.now() - started_at` сам, фронту доверять нельзя.
- Если игрок отправляет `answerData` после истечения `timeLimitMs * 1.5` — засчитывается как неверный (защита от подмены времени на клиенте).
- На `POST /api/session/answer` проверяется, что `questionId == текущий`. Прыгать вперёд нельзя.

---

## CORS
В prod фронт и API живут на одном origin (через nginx) — CORS не нужен. В dev:
```js
fastify.register(cors, { origin: 'http://localhost:5173', credentials: true });
```
