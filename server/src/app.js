import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { config } from './config.js';
import { publicRoutes } from './routes/publicRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { uploadRoutes } from './routes/uploadRoutes.js';
import { createIO } from './realtime/io.js';
import { setIo } from './game/sessionFlow.js';
import { logger } from './utils/logger.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: false,
    bodyLimit: 6 * 1024 * 1024,
    trustProxy: true,
  });

  await fastify.register(cookie);
  await fastify.register(multipart, { limits: { fileSize: config.uploadMaxBytes + 1024 } });
  await fastify.register(cors, config.isDev
    ? { origin: 'http://localhost:5173', credentials: true }
    : { origin: false }
  );
  await fastify.register(fastifyStatic, {
    root: path.resolve(config.uploadsDir),
    prefix: '/uploads/',
    immutable: true,
    maxAge: '30d',
    decorateReply: false,
  });

  await fastify.register(publicRoutes);
  await fastify.register(adminRoutes);
  await fastify.register(uploadRoutes);

  fastify.setErrorHandler((error, _request, reply) => {
    logger.error('Unhandled error', { message: error.message });
    reply.code(error.statusCode ?? 500).send({ error: 'internal', message: 'Внутренняя ошибка сервера' });
  });

  // Socket.IO attaches to the HTTP server — must happen before listen
  // but after fastify is fully registered. We expose an attach helper.
  fastify.decorate('attachIO', () => {
    const io = createIO(fastify.server);
    fastify.io = io;
    setIo(io);
    logger.info('Socket.IO attached');
  });

  return fastify;
}
