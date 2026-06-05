const ts = () => new Date().toISOString();

function fmt(level, msg, extra) {
  const base = `[${ts()}] ${level.toUpperCase()} ${msg}`;
  return extra ? `${base} ${JSON.stringify(extra)}` : base;
}

export const logger = {
  info: (msg, extra) => console.log(fmt('info', msg, extra)),
  warn: (msg, extra) => console.warn(fmt('warn', msg, extra)),
  error: (msg, extra) => console.error(fmt('error', msg, extra)),
};
