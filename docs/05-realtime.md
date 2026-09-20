# 05. Socket.IO

Подключение через тот же origin, путь по умолчанию `/socket.io/`.

## Комнаты (rooms)

| комната        | кто подключается                                | требования          |
|----------------|--------------------------------------------------|---------------------|
| `admin`        | админская часть фронта                           | валидная cookie `cf_admin` |
| `dashboard`    | публичный экран топ-10                           | без авторизации     |

В MVP **сокеты для игрока не нужны** — он работает через HTTP. Серверные таймеры по сессии в MVP не реализуем (клиент сам стартует таймер от `startedAt`).

## Аутентификация при `connection`
Middleware `realtime/io.js`:
1. Парсит cookie из handshake.
2. Если клиент шлёт `auth.role = "admin"` — проверяет `cf_admin`; иначе отклоняет (`disconnect`).
3. Если `auth.role = "dashboard"` — пускает без проверки, добавляет в комнату `dashboard`.

Пример клиента:
```js
io({ auth: { role: 'admin' } })
io({ auth: { role: 'dashboard' } })
```

---

## События сервер → клиент

### Комната `admin`

#### `players:snapshot`
Полный список после подключения (для первичной синхронизации, как fallback к HTTP).
```json
{ "sessions": [ /* как в GET /api/admin/sessions */ ] }
```

#### `players:new`
Новый игрок начал сессию.
```json
{ "session": { "id": "...", "lastName": "...", "firstName": "...", "startedAt": ..., "totalScore": 0, "progress": {"answered":0,"total":7}, "finishedAt": null, "hiddenFromDashboard": false } }
```

#### `players:update`
Игрок ответил на вопрос (прогресс/счёт изменились).
```json
{
  "sessionId": "...",
  "progress": { "answered": 4, "total": 7 },
  "totalScore": 240
}
```

#### `players:finished`
Сессия завершена.
```json
{
  "sessionId": "...",
  "totalScore": 540,
  "finishedAt": 1730000999000
}
```

#### `players:visibility`
Админ скрыл/показал игрока.
```json
{ "sessionId": "...", "hiddenFromDashboard": true }
```

#### `questions:changed`
Что-то изменилось в редакторе вопросов (для синхронизации между вкладками админа).
```json
{ "kind": "created" | "updated" | "reordered" | "active_changed", "questionId": 42 }
```

### Комната `dashboard`

#### `top:update`
Полный массив топ-10 (диффы не нужны при таком размере).
```json
{
  "top": [
    { "rank": 1, "sessionId": "...", "name": "Иванов П.", "totalScore": 880, "finishedAt": ... },
    ...
  ]
}
```
Шлётся при:
- `players:finished`,
- изменении `hiddenFromDashboard`,
- ручном пересчёте (редко).

---

## События клиент → сервер
Нет. Все мутации идут через HTTP, сокет — read-only push-канал.

## Поведение при реконнекте
Клиент обоих типов после `connect` запрашивает свежие данные:
- админ: `GET /api/admin/sessions` + `GET /api/admin/questions`;
- дашборд: `GET /api/dashboard/top`.

Сервер ничего не помнит про предыдущие соединения.

## Нагрузка
~30 активных сессий → ~30 событий `players:update` за раунд капчи. Это пренебрежимо. Дашборд получает событие раз в несколько секунд в пике. Кластер/Redis не нужны.
