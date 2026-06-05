import { buildApp } from './app.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import db from './db/client.js';

async function main() {
  const app = await buildApp();

  // Socket.IO must be attached before listen so it shares the HTTP server
  app.attachIO();

  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`Server listening on ${config.host}:${config.port}`);
  } catch (err) {
    logger.error('Failed to start', { message: err.message });
    process.exit(1);
  }

  const stop = async (signal) => {
    logger.info(`${signal} — shutting down`);
    await app.close();
    db.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));
}

main().catch((err) => {
  logger.error('Startup error', { message: err.message, stack: err.stack });
  process.exit(1);
});
