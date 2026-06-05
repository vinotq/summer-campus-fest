import db from '../client.js';

const stmtInsert = db.prepare(`
  INSERT INTO uploads (filename, mime, size, width, height, created_at)
  VALUES (@filename, @mime, @size, @width, @height, @created_at)
`);
const stmtGetByFilename = db.prepare('SELECT * FROM uploads WHERE filename=?');

export function insert({ filename, mime, size, width, height }) {
  stmtInsert.run({ filename, mime, size, width: width ?? null, height: height ?? null, created_at: Date.now() });
}

export function getByFilename(filename) {
  return stmtGetByFilename.get(filename) ?? null;
}
