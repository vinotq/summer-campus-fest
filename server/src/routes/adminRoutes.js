import { requireAdmin, verifyPassword, issueCookie, clearCookie } from '../auth/adminAuth.js';
import * as questionsRepo from '../db/repo/questions.js';
import * as sessionsRepo from '../db/repo/sessions.js';
import * as answersRepo from '../db/repo/answers.js';
import * as settingsRepo from '../db/repo/settings.js';
import { questionTypes } from '../game/questionTypes.js';
import { buildTopList } from '../game/sessionFlow.js';
import { config } from '../config.js';
import { emitQuestionsChanged, emitPlayersVisibility } from '../realtime/adminChannel.js';
import { emitTopUpdate } from '../realtime/dashboardChannel.js';

// Simple in-memory rate limiter for login endpoint
const loginAttempts = new Map(); // ip -> { count, resetAt }
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}
function resetRateLimit(ip) {
  loginAttempts.delete(ip);
}

function formatSession(session) {
  const answered = answersRepo.listBySession(session.id).length;
  return {
    id: session.id,
    lastName: session.last_name,
    firstName: session.first_name,
    startedAt: session.started_at,
    finishedAt: session.finished_at,
    totalScore: session.total_score,
    progress: { answered, total: session.question_ids_snapshot.length },
    hiddenFromDashboard: session.hidden_from_dashboard,
  };
}

function formatQuestion(q) {
  return {
    id: q.id,
    type: q.type,
    title: q.title,
    baseScore: q.base_score,
    timeLimitMs: q.time_limit_ms,
    answerDelayMs: q.answer_delay_ms ?? 0,
    active: q.active,
    orderIndex: q.order_index,
    payload: q.payload,
    createdAt: q.created_at,
    updatedAt: q.updated_at,
  };
}

export async function adminRoutes(fastify) {
  // POST /api/admin/login
  fastify.post('/api/admin/login', async (request, reply) => {
    const ip = request.ip;
    if (!checkRateLimit(ip)) {
      return reply.code(429).send({ error: 'rate_limited', message: 'Слишком много попыток. Подождите 5 минут.' });
    }
    const { login, password } = request.body ?? {};
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300)); // timing protection
    if (login !== config.adminLogin || !verifyPassword(password, config.adminPasswordHash)) {
      return reply.code(401).send({ error: 'unauthorized', message: 'Неверный логин или пароль' });
    }
    resetRateLimit(ip);
    issueCookie(reply);
    return reply.send({ ok: true });
  });

  // POST /api/admin/logout
  fastify.post('/api/admin/logout', async (_request, reply) => {
    clearCookie(reply);
    return reply.send({ ok: true });
  });

  // GET /api/admin/me
  fastify.get('/api/admin/me', { preHandler: requireAdmin }, async (_request, reply) => {
    return reply.send({ login: config.adminLogin });
  });

  // ------- Questions -------

  // GET /api/admin/questions
  fastify.get('/api/admin/questions', { preHandler: requireAdmin }, async (_request, reply) => {
    return reply.send({ questions: questionsRepo.list().map(formatQuestion) });
  });

  // POST /api/admin/questions
  fastify.post('/api/admin/questions', { preHandler: requireAdmin }, async (request, reply) => {
    const { type, title, baseScore, timeLimitMs, active, payload, orderIndex } = request.body ?? {};
    if (!questionTypes[type]) {
      return reply.code(400).send({ error: 'validation', message: `Неизвестный тип: ${type}` });
    }
    try {
      questionTypes[type].validate(payload);
    } catch (e) {
      return reply.code(400).send({ error: 'validation', message: e.message });
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return reply.code(400).send({ error: 'validation', message: 'title обязателен' });
    }
    if (!Number.isInteger(timeLimitMs) || timeLimitMs <= 0) {
      return reply.code(400).send({ error: 'validation', message: 'timeLimitMs должен быть положительным целым числом' });
    }
    const question = questionsRepo.create({ type, title: title.trim(), baseScore, timeLimitMs, active, payload, orderIndex });
    const io = fastify.io;
    if (io) emitQuestionsChanged(io, 'created', question.id);
    return reply.code(201).send({ question: formatQuestion(question) });
  });

  // PATCH /api/admin/questions/:id
  fastify.patch('/api/admin/questions/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const existing = questionsRepo.getById(id);
    if (!existing) return reply.code(404).send({ error: 'not_found', message: 'Вопрос не найден' });

    const data = request.body ?? {};
    const newType = data.type ?? existing.type;
    const newPayload = data.payload !== undefined ? data.payload : existing.payload;

    if (!questionTypes[newType]) {
      return reply.code(400).send({ error: 'validation', message: `Неизвестный тип: ${newType}` });
    }
    try {
      questionTypes[newType].validate(newPayload);
    } catch (e) {
      return reply.code(400).send({ error: 'validation', message: e.message });
    }

    const updated = questionsRepo.update(id, {
      type: newType,
      title: data.title,
      baseScore: data.baseScore,
      timeLimitMs: data.timeLimitMs,
      answerDelayMs: data.answerDelayMs,
      active: data.active,
      orderIndex: data.orderIndex,
      payload: newPayload,
    });
    const io = fastify.io;
    if (io) emitQuestionsChanged(io, 'updated', id);
    return reply.send({ question: formatQuestion(updated) });
  });

  // PATCH /api/admin/questions/:id/active
  fastify.patch('/api/admin/questions/:id/active', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (!questionsRepo.getById(id)) return reply.code(404).send({ error: 'not_found', message: 'Вопрос не найден' });
    const { active } = request.body ?? {};
    if (typeof active !== 'boolean') {
      return reply.code(400).send({ error: 'validation', message: 'active должен быть boolean' });
    }
    questionsRepo.setActive(id, active);
    const io = fastify.io;
    if (io) emitQuestionsChanged(io, 'active_changed', id);
    return reply.send({ ok: true });
  });

  // DELETE /api/admin/questions/:id
  fastify.delete('/api/admin/questions/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (!questionsRepo.getById(id)) return reply.code(404).send({ error: 'not_found', message: 'Вопрос не найден' });
    questionsRepo.remove(id);
    const io = fastify.io;
    if (io) emitQuestionsChanged(io, 'deleted', id);
    return reply.send({ ok: true });
  });

  // GET /api/admin/questions/:id/stats
  fastify.get('/api/admin/questions/:id/stats', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (!questionsRepo.getById(id)) return reply.code(404).send({ error: 'not_found', message: 'Вопрос не найден' });
    return reply.send(answersRepo.getQuestionStats(id));
  });

  // PUT /api/admin/questions/reorder
  fastify.put('/api/admin/questions/reorder', { preHandler: requireAdmin }, async (request, reply) => {
    const { ids } = request.body ?? {};
    if (!Array.isArray(ids) || ids.some((x) => !Number.isInteger(x))) {
      return reply.code(400).send({ error: 'validation', message: 'ids должен быть массивом целых чисел' });
    }
    questionsRepo.reorder(ids);
    const io = fastify.io;
    if (io) emitQuestionsChanged(io, 'reordered', null);
    return reply.send({ ok: true });
  });

  // ------- Sessions -------

  // GET /api/admin/sessions
  fastify.get('/api/admin/sessions', { preHandler: requireAdmin }, async (_request, reply) => {
    const sessions = sessionsRepo.listAll().map(formatSession);
    return reply.send({ sessions });
  });

  // PATCH /api/admin/sessions/:id/visibility
  fastify.patch('/api/admin/sessions/:id/visibility', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params;
    const session = sessionsRepo.getById(id);
    if (!session) return reply.code(404).send({ error: 'not_found', message: 'Сессия не найдена' });
    const { hiddenFromDashboard } = request.body ?? {};
    if (typeof hiddenFromDashboard !== 'boolean') {
      return reply.code(400).send({ error: 'validation', message: 'hiddenFromDashboard должен быть boolean' });
    }
    sessionsRepo.setHidden(id, hiddenFromDashboard);
    const io = fastify.io;
    if (io) {
      emitPlayersVisibility(io, id, hiddenFromDashboard);
      emitTopUpdate(io, buildTopList());
    }
    return reply.send({ ok: true });
  });

  // GET /api/admin/sessions/:id/results
  fastify.get('/api/admin/sessions/:id/results', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params;
    const session = sessionsRepo.getById(id);
    if (!session) return reply.code(404).send({ error: 'not_found', message: 'Сессия не найдена' });
    const rawAnswers = answersRepo.listBySession(id);
    const answers = rawAnswers.map(a => {
      const q = questionsRepo.getById(a.question_id);
      return {
        id: a.id,
        questionId: a.question_id,
        questionTitle: q?.title ?? `Вопрос #${a.question_id}`,
        questionType: q?.type ?? 'unknown',
        baseScore: q?.base_score ?? 0,
        correct: a.correct,
        score: a.score,
        elapsedMs: a.elapsed_ms,
        answerData: a.answer_data,
      };
    });
    return reply.send({
      session: {
        id: session.id,
        lastName: session.last_name,
        firstName: session.first_name,
        startedAt: session.started_at,
        finishedAt: session.finished_at,
        totalScore: session.total_score,
      },
      answers,
    });
  });

  // PATCH /api/admin/answers/:answerId
  fastify.patch('/api/admin/answers/:answerId', { preHandler: requireAdmin }, async (request, reply) => {
    const answerId = Number(request.params.answerId);
    const answer = answersRepo.getById(answerId);
    if (!answer) return reply.code(404).send({ error: 'not_found', message: 'Ответ не найден' });
    const { correct, score } = request.body ?? {};
    if (typeof score !== 'number' || score < 0) {
      return reply.code(400).send({ error: 'validation', message: 'score должен быть числом >= 0' });
    }
    answersRepo.update(answerId, { correct: Boolean(correct), score: Math.round(score) });
    const newTotal = answersRepo.recalcSessionTotal(answer.session_id);
    sessionsRepo.setScore(answer.session_id, newTotal);
    const io = fastify.io;
    if (io) emitTopUpdate(io, buildTopList());
    return reply.send({ ok: true, newTotal });
  });

  // DELETE /api/admin/data/players
  fastify.delete('/api/admin/data/players', { preHandler: requireAdmin }, async (_request, reply) => {
    sessionsRepo.clearAllPlayers();
    const io = fastify.io;
    if (io) emitTopUpdate(io, []);
    return reply.send({ ok: true });
  });

  // GET /api/admin/settings/quiz
  fastify.get('/api/admin/settings/quiz', { preHandler: requireAdmin }, async (_request, reply) => {
    return reply.send(settingsRepo.getQuizSettings());
  });

  // PATCH /api/admin/settings/quiz
  fastify.patch('/api/admin/settings/quiz', { preHandler: requireAdmin }, async (request, reply) => {
    const body = request.body ?? {};
    settingsRepo.setQuizSettings(body);
    return reply.send(settingsRepo.getQuizSettings());
  });
}
