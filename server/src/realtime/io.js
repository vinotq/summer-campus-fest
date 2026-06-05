import { Server } from 'socket.io';
import { config } from '../config.js';
import { verify } from '../utils/hmac.js';
import { logger } from '../utils/logger.js';
import * as sessionsRepo from '../db/repo/sessions.js';
import * as answersRepo from '../db/repo/answers.js';
import { buildTopList } from '../game/sessionFlow.js';

export function createIO(httpServer) {
  const io = new Server(httpServer, {
    cors: config.isDev
      ? { origin: 'http://localhost:5173', credentials: true }
      : false,
    maxHttpBufferSize: 1e6,
    path: '/socket.io/',
  });

  io.use((socket, next) => {
    const role = socket.handshake.auth?.role;

    if (role === 'admin') {
      const rawCookie = socket.handshake.headers.cookie || '';
      const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${config.adminCookieName}=([^;]+)`));
      const token = match ? decodeURIComponent(match[1]) : null;
      const payload = verify(token);
      if (!payload || payload.kind !== 'admin') {
        return next(new Error('unauthorized'));
      }
      socket.join('admin');
      logger.info(`Socket admin connected: ${socket.id}`);
      return next();
    }

    if (role === 'dashboard') {
      socket.join('dashboard');
      logger.info(`Socket dashboard connected: ${socket.id}`);
      return next();
    }

    return next(new Error('unknown role'));
  });

  io.on('connection', (socket) => {
    const rooms = [...socket.rooms];
    if (rooms.includes('admin')) {
      const sessions = sessionsRepo.listAll().map((s) => {
        const answered = answersRepo.listBySession(s.id).length;
        return {
          id: s.id,
          lastName: s.last_name,
          firstName: s.first_name,
          startedAt: s.started_at,
          finishedAt: s.finished_at,
          totalScore: s.total_score,
          progress: { answered, total: s.question_ids_snapshot.length },
          hiddenFromDashboard: s.hidden_from_dashboard,
        };
      });
      socket.emit('players:snapshot', { sessions });
    }
    if (rooms.includes('dashboard')) {
      socket.emit('top:update', { top: buildTopList() });
    }
  });

  return io;
}
