import db from '../client.js';

const stmtInsert = db.prepare(`
  INSERT INTO answers (session_id, question_id, started_at, answered_at, elapsed_ms, answer_data, correct, score)
  VALUES (@session_id, @question_id, @started_at, @answered_at, @elapsed_ms, @answer_data, @correct, @score)
`);
const stmtExists = db.prepare(
  'SELECT id FROM answers WHERE session_id=? AND question_id=?'
);
const stmtListBySession = db.prepare(
  'SELECT * FROM answers WHERE session_id=? ORDER BY id'
);
const stmtSumScore = db.prepare(
  'SELECT COALESCE(SUM(score),0) as total FROM answers WHERE session_id=?'
);

const stmtQuestionStats = db.prepare(`
  SELECT
    COUNT(*) as attempts,
    COALESCE(AVG(elapsed_ms), 0) as avg_elapsed_ms,
    COALESCE(SUM(correct), 0) as correct_count,
    COALESCE(MIN(elapsed_ms), 0) as min_elapsed_ms,
    COALESCE(MAX(elapsed_ms), 0) as max_elapsed_ms
  FROM answers WHERE question_id=?
`);

const stmtGetById = db.prepare('SELECT * FROM answers WHERE id=?');
const stmtUpdate = db.prepare('UPDATE answers SET correct=@correct, score=@score WHERE id=@id');
const stmtSumBySession = db.prepare('SELECT COALESCE(SUM(score),0) as total FROM answers WHERE session_id=?');

const stmtPendingInsert = db.prepare(`
  INSERT OR IGNORE INTO pending_answers (session_id, question_id, started_at)
  VALUES (@session_id, @question_id, @started_at)
`);
const stmtPendingGet = db.prepare(
  'SELECT started_at FROM pending_answers WHERE session_id=? AND question_id=?'
);
const stmtPendingDelete = db.prepare(
  'DELETE FROM pending_answers WHERE session_id=? AND question_id=?'
);

export function insert(data) {
  return stmtInsert.run({
    session_id: data.sessionId,
    question_id: data.questionId,
    started_at: data.startedAt,
    answered_at: data.answeredAt,
    elapsed_ms: data.elapsedMs,
    answer_data: JSON.stringify(data.answerData),
    correct: data.correct ? 1 : 0,
    score: data.score,
  });
}

export function existsForSession(sessionId, questionId) {
  return Boolean(stmtExists.get(sessionId, questionId));
}

export function listBySession(sessionId) {
  return stmtListBySession.all(sessionId).map((r) => ({
    ...r,
    correct: Boolean(r.correct),
    answer_data: JSON.parse(r.answer_data),
  }));
}

export function sumScoreForSession(sessionId) {
  return stmtSumScore.get(sessionId).total;
}

export function touchPending(sessionId, questionId) {
  stmtPendingInsert.run({ session_id: sessionId, question_id: questionId, started_at: Date.now() });
  return stmtPendingGet.get(sessionId, questionId)?.started_at ?? Date.now();
}

export function deletePending(sessionId, questionId) {
  stmtPendingDelete.run(sessionId, questionId);
}

export function getPendingStartedAt(sessionId, questionId) {
  return stmtPendingGet.get(sessionId, questionId)?.started_at ?? null;
}

export function getById(id) {
  const r = stmtGetById.get(id);
  if (!r) return null;
  return { ...r, correct: Boolean(r.correct), answer_data: JSON.parse(r.answer_data) };
}

export function update(id, { correct, score }) {
  stmtUpdate.run({ id, correct: correct ? 1 : 0, score });
}

export function recalcSessionTotal(sessionId) {
  return stmtSumBySession.get(sessionId).total;
}

export function getQuestionStats(questionId) {
  const row = stmtQuestionStats.get(questionId);
  return {
    attempts: row.attempts,
    avgElapsedMs: Math.round(row.avg_elapsed_ms),
    minElapsedMs: row.min_elapsed_ms,
    maxElapsedMs: row.max_elapsed_ms,
    correctCount: row.correct_count,
    correctPct: row.attempts > 0 ? Math.round((row.correct_count / row.attempts) * 100) : 0,
  };
}
