import db from '../client.js';

// Default: сколько случайных вопросов брать из каждого типа
const DEFAULT_COUNTS = { grid3x3: 3, tiles: 1, slider: 2, audio: 2, imageCode: 1 };

const stmtGet = db.prepare('SELECT value FROM quiz_settings WHERE key=?');
const stmtSet = db.prepare('INSERT OR REPLACE INTO quiz_settings (key, value) VALUES (?, ?)');

// Full settings object:
// {
//   counts: { grid3x3: 3, tiles: 1, ... },   // сколько рандомных из каждого типа
//   required: [1, 5, 12]                       // id вопросов, которые всегда идут (в начале)
// }

function getRow(key) {
  const row = stmtGet.get(key);
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return null; }
}

export function getQuizSettings() {
  return {
    counts: getRow('question_counts') ?? { ...DEFAULT_COUNTS },
    required: getRow('required_questions') ?? [],
  };
}

export function setQuizSettings({ counts, required }) {
  if (counts) stmtSet.run('question_counts', JSON.stringify(counts));
  if (required !== undefined) stmtSet.run('required_questions', JSON.stringify(required));
}
