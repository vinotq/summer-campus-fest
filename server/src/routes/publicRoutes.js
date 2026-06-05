import { issueSessionCookie, requirePlayer, getSessionId } from '../auth/playerSession.js';
import * as sessionsRepo from '../db/repo/sessions.js';
import { startSession, getCurrentQuestion, submitAnswer, buildTopList } from '../game/sessionFlow.js';

function err(code, message, httpCode = 400) {
  return { httpCode, body: { error: code, message } };
}

export async function publicRoutes(fastify) {
  // POST /api/start
  fastify.post('/api/start', async (request, reply) => {
    const { lastName, firstName, fingerprint } = request.body ?? {};

    if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0 || lastName.length > 64) {
      return reply.code(400).send({ error: 'validation', message: 'Фамилия обязательна (до 64 символов)' });
    }
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0 || firstName.length > 64) {
      return reply.code(400).send({ error: 'validation', message: 'Имя обязательно (до 64 символов)' });
    }

    // Max attempts check
    const attempts = sessionsRepo.countFinishedByName(lastName.trim(), firstName.trim());
    if (attempts >= 3) {
      return reply.code(409).send({ error: 'max_attempts', message: 'Вы уже прошли квиз 3 раза под этим именем' });
    }

    // Conflict: already has an ACTIVE (not finished) session
    const existingSid = getSessionId(request);
    if (existingSid) {
      const existing = sessionsRepo.getById(existingSid);
      if (existing && existing.finished_at == null) {
        return reply.code(409).send({ error: 'conflict', message: 'Сессия уже существует', sessionId: existing.id });
      }
    }

    try {
      const result = startSession({ lastName: lastName.trim(), firstName: firstName.trim(), fingerprint });
      issueSessionCookie(reply, result.sessionId);
      return reply.code(201).send(result);
    } catch (e) {
      if (e.code === 'validation') return reply.code(400).send({ error: 'validation', message: e.message });
      throw e;
    }
  });

  // GET /api/session/current
  fastify.get('/api/session/current', { preHandler: requirePlayer }, async (request, reply) => {
    const result = getCurrentQuestion(request.session.id);
    return reply.send(result);
  });

  // POST /api/session/answer
  fastify.post('/api/session/answer', { preHandler: requirePlayer }, async (request, reply) => {
    const { questionId, answerData } = request.body ?? {};
    if (!questionId || typeof questionId !== 'number') {
      return reply.code(400).send({ error: 'validation', message: 'questionId обязателен' });
    }
    try {
      const result = submitAnswer(request.session.id, questionId, answerData);
      return reply.send(result);
    } catch (e) {
      const codeMap = { session_finished: 409, already_answered: 409, validation: 400, unauthorized: 401 };
      const httpCode = codeMap[e.code] ?? 400;
      return reply.code(httpCode).send({ error: e.code || 'validation', message: e.message });
    }
  });

  // GET /api/session/result
  fastify.get('/api/session/result', { preHandler: requirePlayer }, async (request, reply) => {
    const result = getCurrentQuestion(request.session.id);
    if (result.status !== 'finished') {
      return reply.code(400).send({ error: 'validation', message: 'Сессия ещё не завершена' });
    }
    return reply.send(result);
  });

  // GET /api/session/history — все завершённые сессии текущего игрока
  fastify.get('/api/session/history', { preHandler: requirePlayer }, async (request, reply) => {
    const session = sessionsRepo.getById(request.session.id);
    if (!session) return reply.code(404).send({ error: 'not_found' });
    const rows = sessionsRepo.listFinishedByName(session.last_name, session.first_name);
    const top = sessionsRepo.listTopBest(100);
    const attempts = rows.map((s, i) => {
      const rankIdx = top.findIndex(t => t.last_name === s.last_name && t.first_name === s.first_name);
      return {
        index: i + 1,
        sessionId: s.id,
        totalScore: s.total_score,
        finishedAt: s.finished_at,
        rank: rankIdx >= 0 ? rankIdx + 1 : null,
      };
    });
    return reply.send({ lastName: session.last_name, firstName: session.first_name, attempts });
  });

  // GET /api/dashboard/top — public
  fastify.get('/api/dashboard/top', async (_request, reply) => {
    return reply.send({ top: buildTopList() });
  });

  // GET /api/health — public
  fastify.get('/api/health', async (_request, reply) => {
    return reply.send({ ok: true, uptime: process.uptime() });
  });
}
