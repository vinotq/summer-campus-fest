# 07. Скоринг и поток сессии

## Алгоритм очков

`server/src/game/scoring.js`:

```js
function score({ baseScore, timeLimitMs, elapsedMs, correct }) {
  if (!correct) return 0;
  const ratio = Math.max(0.2, 1 - elapsedMs / timeLimitMs);
  return Math.round(baseScore * ratio);
}
```

- За правильный мгновенный ответ — `baseScore`.
- За правильный ответ на грани времени — `baseScore * 0.2`.
- За время сверх `timeLimitMs` — всё равно минимум `0.2 * baseScore` (если ответ корректный и пришёл в пределах `timeLimitMs * 1.5` — anti-cheat clamp).
- Неправильный — 0.

`total_score` сессии = сумма `score` по всем `answers`.

---

## Жизненный цикл сессии (`sessionFlow.js`)

### `startSession({lastName, firstName, fingerprint})`
1. Получить активные вопросы: `questions.listActive()`. Если пусто — `400 validation { message: "Нет активных вопросов" }`.
2. Зафиксировать массив их id в `question_ids_snapshot`.
3. Вставить запись в `sessions` (`current_question_idx = 0`).
4. Эмитить `players:new` в комнату `admin`.
5. Вернуть `{ sessionId, totalQuestions, startedAt }`.

### `getCurrentQuestion(sessionId)`
1. Получить `session`. Если `finished_at != null` — вернуть `{ status: 'finished', result }`.
2. `idx = current_question_idx`; если `idx >= len(snapshot)` — финализировать (см. ниже).
3. `qid = snapshot[idx]`. Получить `questions.getById(qid)`.
4. Найти/создать «черновик ответа»: в `answers` запись с `(session_id, question_id)` либо ещё не существует, либо уже есть с `answered_at = NULL`.
   - **Решение:** не создаём «черновик» в БД. Вместо этого храним `startedAt` отдельным полем. Проще — добавить в таблицу `answers` строки только при ответе, а `startedAt` хранить в **отдельной таблице** или **в-памяти**.
   - **Финальное решение:** добавить колонку `answers.started_at` и при первом `GET current` для нового `qid` сразу делать `INSERT INTO answers (session_id, question_id, started_at, answered_at, elapsed_ms, answer_data, correct, score) VALUES (?, ?, ?, NULL_PLACEHOLDER, 0, '{}', 0, 0)`. **Проще:** держать отдельную таблицу `pending_answers(session_id, question_id, started_at)`.
   - Для MVP: **отдельная таблица `pending_answers`**, см. `01-database.md` (добавить).

5. Вернуть `publicView` вопроса + `startedAt` + `timeLimitMs` + `progress`.

> **Правка к `01-database.md`:** добавить таблицу
> ```sql
> CREATE TABLE pending_answers (
>   session_id TEXT NOT NULL,
>   question_id INTEGER NOT NULL,
>   started_at INTEGER NOT NULL,
>   PRIMARY KEY (session_id, question_id)
> );
> ```
> При вставке окончательного `answers` соответствующая запись из `pending_answers` удаляется.

### `submitAnswer(sessionId, questionId, answerData)`
1. Загрузить `session`; если `finished_at` — `409 session_finished`.
2. Сверить `questionId == snapshot[current_question_idx]`, иначе `400 validation`.
3. Загрузить `question`. Получить `started_at` из `pending_answers`. Если нет — считать `started_at = Date.now()` (защитный fallback).
4. `elapsedMs = clamp(Date.now() - started_at, 0, timeLimitMs * 1.5)`.
5. `correct = questionTypes[type].check(payload, answerData)`.
6. `points = scoring.score({ baseScore, timeLimitMs, elapsedMs, correct })`.
7. Транзакционно:
   - `INSERT INTO answers (...)`.
   - `DELETE FROM pending_answers WHERE session_id=? AND question_id=?`.
   - `UPDATE sessions SET current_question_idx = current_question_idx + 1, total_score = total_score + ?`.
8. Эмитить `players:update` админу.
9. Если индекс достиг конца snapshot → `finishSession(sessionId)`.
10. Вернуть `{ correct, score, elapsedMs, next }`.

### `finishSession(sessionId)`
1. Пересчитать `total_score = SUM(score)` (на всякий случай).
2. `UPDATE sessions SET finished_at = now(), total_score = ?`.
3. Эмитить `players:finished` в `admin`.
4. Пересчитать топ-10 → эмитить `top:update` в `dashboard`.

---

## Распределение времени по вопросам
Каждый вопрос имеет собственный `time_limit_ms` (задаётся в редакторе). Общего таймера на всю сессию **нет**. Если админ хочет «5 минут на всё» — он распределяет вручную: например 7 вопросов × ~43 секунды.

В UI редактора показывать сумму `time_limit_ms` активных вопросов: «Суммарный бюджет: 4:30».

---

## Идемпотентность
- `POST /api/session/answer` для одного и того же `questionId` повторно — `409 already_answered`.
- `GET /api/session/current` идемпотентен, не сдвигает таймер.
- `GET /api/session/result` доступен в любой момент после финиша.
