# 01. База данных

SQLite, файл `data/db.sqlite`. Накат схемы — из `server/src/db/schema.sql` при старте процесса (idempotent: `CREATE TABLE IF NOT EXISTS ...`). Включаем WAL и foreign keys.

## Инициализация (в `db/client.js`)
```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;
```

## Таблицы

### `questions`
Вопрос капчи. `payload` хранит тип-специфичные данные (см. `03-question-types.md`).

| поле          | тип       | примечание |
|---------------|-----------|-----------|
| id            | INTEGER PK AUTOINCREMENT | |
| type          | TEXT NOT NULL | `grid3x3` \| `tiles` \| `slider` \| `audio` \| `imageCode` |
| title         | TEXT NOT NULL | вопрос игроку («Выберите просроченные продукты») |
| base_score    | INTEGER NOT NULL DEFAULT 100 | базовая ставка очков |
| time_limit_ms | INTEGER NOT NULL | время на ответ в миллисекундах |
| active        | INTEGER NOT NULL DEFAULT 1 | 0/1 |
| order_index   | INTEGER NOT NULL DEFAULT 0 | порядок показа |
| payload       | TEXT NOT NULL | JSON, валидируется сервером по `type` |
| created_at    | INTEGER NOT NULL | unix ms |
| updated_at    | INTEGER NOT NULL | unix ms |


### `sessions`
Игровая попытка.

| поле                    | тип | примечание |
|-------------------------|-----|-----------|
| id                      | TEXT PK | uuid v4 |
| last_name               | TEXT NOT NULL | Фамилия |
| first_name              | TEXT NOT NULL | Имя |
| started_at              | INTEGER NOT NULL | unix ms, момент создания |
| finished_at             | INTEGER | NULL пока не завершена |
| total_score             | INTEGER NOT NULL DEFAULT 0 | пересчитывается при завершении |
| hidden_from_dashboard   | INTEGER NOT NULL DEFAULT 0 | админ скрыл с топ-10 |
| current_question_idx    | INTEGER NOT NULL DEFAULT 0 | указатель в снапшоте |
| question_ids_snapshot   | TEXT NOT NULL | JSON-массив id вопросов, зафиксированный на старте сессии |
| client_fingerprint      | TEXT | необязательно, для мягкой защиты от повтора |


**Почему snapshot:** если админ выключит вопрос посередине игры, у активного игрока ничего не сломается — он играет по своему списку.

### `answers`
Ответ игрока на конкретный вопрос.

| поле          | тип | примечание |
|---------------|-----|-----------|
| id            | INTEGER PK AUTOINCREMENT | |
| session_id    | TEXT NOT NULL → sessions(id) ON DELETE CASCADE | |
| question_id   | INTEGER NOT NULL → questions(id) | |
| started_at    | INTEGER NOT NULL | момент выдачи вопроса игроку |
| answered_at   | INTEGER NOT NULL | момент получения ответа сервером |
| elapsed_ms    | INTEGER NOT NULL | `answered_at - started_at` |
| answer_data   | TEXT NOT NULL | JSON, формат зависит от типа |
| correct       | INTEGER NOT NULL | 0/1 |
| score         | INTEGER NOT NULL | посчитанные очки за этот ответ |


### `uploads`
Реестр загруженных файлов (для админки и для очистки orphan-файлов).

| поле        | тип | примечание |
|-------------|-----|-----------|
| id          | INTEGER PK AUTOINCREMENT | |
| filename    | TEXT NOT NULL | имя на диске (uuid + ext) |
| mime        | TEXT NOT NULL | |
| size        | INTEGER NOT NULL | байты |
| width       | INTEGER | для изображений |
| height      | INTEGER | для изображений |
| created_at  | INTEGER NOT NULL | |

## Виды запросов (горячие)

- **Активные вопросы в порядке:** `SELECT * FROM questions WHERE active=1 ORDER BY order_index, id`.
- **Топ-10 для дашборда:** `SELECT id, last_name, first_name, total_score FROM sessions WHERE finished_at IS NOT NULL AND hidden_from_dashboard=0 ORDER BY total_score DESC, finished_at ASC LIMIT 10`.
- **Список всех (админ):** `SELECT ... FROM sessions ORDER BY started_at DESC`.
- **Прогресс игрока:** `SELECT COUNT(*) FROM answers WHERE session_id=?`.

## Бэкап
`cp data/db.sqlite data/backup-<ts>.sqlite` (cron раз в час, по 1 шт. на сутки + одна последняя). Скрипт в `10-deployment.md`.
