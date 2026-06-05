import db from '../client.js';

const stmtInsert = db.prepare(`
  INSERT INTO sessions (id, last_name, first_name, started_at, total_score, hidden_from_dashboard,
    current_question_idx, question_ids_snapshot, client_fingerprint)
  VALUES (@id, @last_name, @first_name, @started_at, 0, 0, 0, @question_ids_snapshot, @client_fingerprint)
`);
const stmtGetById = db.prepare('SELECT * FROM sessions WHERE id=?');
const stmtListAll = db.prepare('SELECT * FROM sessions ORDER BY started_at DESC');
const stmtTop = db.prepare(`
  SELECT id, last_name, first_name, total_score, finished_at
  FROM sessions
  WHERE finished_at IS NOT NULL AND hidden_from_dashboard=0
  ORDER BY total_score DESC, finished_at ASC
  LIMIT ?
`);
const stmtTopBest = db.prepare(`
  SELECT
    last_name, first_name,
    MAX(total_score) AS total_score,
    MIN(finished_at) AS finished_at
  FROM sessions
  WHERE finished_at IS NOT NULL AND hidden_from_dashboard=0
  GROUP BY last_name, first_name
  ORDER BY total_score DESC, finished_at ASC
  LIMIT ?
`);
const stmtCountFinishedByName = db.prepare(
  'SELECT COUNT(*) as cnt FROM sessions WHERE last_name=? AND first_name=? AND finished_at IS NOT NULL'
);
const stmtListFinishedByName = db.prepare(
  'SELECT id, total_score, finished_at, started_at FROM sessions WHERE last_name=? AND first_name=? AND finished_at IS NOT NULL ORDER BY finished_at ASC'
);
const stmtSetHidden = db.prepare('UPDATE sessions SET hidden_from_dashboard=? WHERE id=?');
const stmtSetScore = db.prepare('UPDATE sessions SET total_score=? WHERE id=?');
const stmtAdvanceIndex = db.prepare(
  'UPDATE sessions SET current_question_idx=current_question_idx+1, total_score=total_score+? WHERE id=?'
);
const stmtFinish = db.prepare(
  'UPDATE sessions SET finished_at=@finished_at, total_score=@total_score WHERE id=@id'
);
const stmtCountAnswers = db.prepare('SELECT COUNT(*) as cnt FROM answers WHERE session_id=?');

function rowToSession(row) {
  if (!row) return null;
  return {
    ...row,
    hidden_from_dashboard: Boolean(row.hidden_from_dashboard),
    question_ids_snapshot: JSON.parse(row.question_ids_snapshot),
  };
}

export function create({ id, lastName, firstName, fingerprint, questionIdsSnapshot }) {
  stmtInsert.run({
    id,
    last_name: lastName,
    first_name: firstName,
    started_at: Date.now(),
    question_ids_snapshot: JSON.stringify(questionIdsSnapshot),
    client_fingerprint: fingerprint || null,
  });
  return getById(id);
}

export function getById(id) {
  return rowToSession(stmtGetById.get(id));
}

export function listAll() {
  return stmtListAll.all().map(rowToSession);
}

export function listTop(limit = 10) {
  return stmtTop.all(limit);
}

export function listTopBest(limit = 10) {
  return stmtTopBest.all(limit);
}

export function getAnsweredCount(sessionId) {
  return stmtCountAnswers.get(sessionId).cnt;
}

export function setHidden(id, hidden) {
  stmtSetHidden.run(hidden ? 1 : 0, id);
}

export function advanceIndex(id, addedScore) {
  stmtAdvanceIndex.run(addedScore, id);
}

export function finish(id, totalScore) {
  stmtFinish.run({ id, finished_at: Date.now(), total_score: totalScore });
}

export function countFinishedByName(lastName, firstName) {
  return stmtCountFinishedByName.get(lastName, firstName).cnt;
}

export function listFinishedByName(lastName, firstName) {
  return stmtListFinishedByName.all(lastName, firstName);
}

export function setScore(id, score) {
  stmtSetScore.run(score, id);
}

export function clearAllPlayers() {
  db.transaction(() => {
    db.exec('DELETE FROM pending_answers');
    db.exec('DELETE FROM answers');
    db.exec('DELETE FROM sessions');
  })();
}
