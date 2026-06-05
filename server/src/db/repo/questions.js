import db from '../client.js';

const stmtListAll = db.prepare(
  'SELECT * FROM questions ORDER BY order_index, id'
);
const stmtListActive = db.prepare(
  'SELECT * FROM questions WHERE active=1 ORDER BY order_index, id'
);
const stmtGetById = db.prepare('SELECT * FROM questions WHERE id=?');
const stmtInsert = db.prepare(`
  INSERT INTO questions (type, title, base_score, time_limit_ms, answer_delay_ms, active, order_index, payload, created_at, updated_at)
  VALUES (@type, @title, @base_score, @time_limit_ms, @answer_delay_ms, @active, @order_index, @payload, @created_at, @updated_at)
`);
const stmtUpdate = db.prepare(`
  UPDATE questions SET
    type=@type, title=@title, base_score=@base_score, time_limit_ms=@time_limit_ms,
    answer_delay_ms=@answer_delay_ms, active=@active, order_index=@order_index,
    payload=@payload, updated_at=@updated_at
  WHERE id=@id
`);
const stmtSetActive = db.prepare(
  'UPDATE questions SET active=@active, updated_at=@updated_at WHERE id=@id'
);
const stmtDeleteAnswers = db.prepare('DELETE FROM answers WHERE question_id=?');
const stmtDeletePending = db.prepare('DELETE FROM pending_answers WHERE question_id=?');
const stmtDelete = db.prepare('DELETE FROM questions WHERE id=?');

function rowToQuestion(row) {
  if (!row) return null;
  return {
    ...row,
    active: Boolean(row.active),
    payload: JSON.parse(row.payload),
  };
}

export function list() {
  return stmtListAll.all().map(rowToQuestion);
}

export function listActive() {
  return stmtListActive.all().map(rowToQuestion);
}

export function getById(id) {
  return rowToQuestion(stmtGetById.get(id));
}

export function create(data) {
  const now = Date.now();
  const info = stmtInsert.run({
    type: data.type,
    title: data.title,
    base_score: data.baseScore ?? 100,
    time_limit_ms: data.timeLimitMs,
    answer_delay_ms: data.answerDelayMs ?? 0,
    active: data.active !== false ? 1 : 0,
    order_index: data.orderIndex ?? 0,
    payload: JSON.stringify(data.payload),
    created_at: now,
    updated_at: now,
  });
  return getById(info.lastInsertRowid);
}

export function update(id, data) {
  const existing = getById(id);
  if (!existing) return null;
  const now = Date.now();
  stmtUpdate.run({
    id,
    type: data.type ?? existing.type,
    title: data.title ?? existing.title,
    base_score: data.baseScore ?? existing.base_score,
    time_limit_ms: data.timeLimitMs ?? existing.time_limit_ms,
    answer_delay_ms: data.answerDelayMs ?? existing.answer_delay_ms ?? 0,
    active: data.active !== undefined ? (data.active ? 1 : 0) : existing.active ? 1 : 0,
    order_index: data.orderIndex ?? existing.order_index,
    payload: data.payload !== undefined ? JSON.stringify(data.payload) : JSON.stringify(existing.payload),
    updated_at: now,
  });
  return getById(id);
}

export function setActive(id, active) {
  stmtSetActive.run({ id, active: active ? 1 : 0, updated_at: Date.now() });
}

export const remove = db.transaction((id) => {
  stmtDeletePending.run(id);
  stmtDeleteAnswers.run(id);
  stmtDelete.run(id);
});

export function reorder(ids) {
  const stmt = db.prepare('UPDATE questions SET order_index=@order_index, updated_at=@updated_at WHERE id=@id');
  const now = Date.now();
  const runMany = db.transaction((ids) => {
    ids.forEach((id, idx) => stmt.run({ id, order_index: idx, updated_at: now }));
  });
  runMany(ids);
}
