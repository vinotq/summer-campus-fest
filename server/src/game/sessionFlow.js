import * as questionsRepo from '../db/repo/questions.js';
import * as sessionsRepo from '../db/repo/sessions.js';
import * as answersRepo from '../db/repo/answers.js';
import * as settingsRepo from '../db/repo/settings.js';
import { generateId } from '../utils/ids.js';
import { score as calcScore } from './scoring.js';
import { checkers } from './checker.js';
import { questionTypes } from './questionTypes.js';
import db from '../db/client.js';

let _io = null;

export function setIo(io) { _io = io; }

function emitAdmin(event, data) { if (_io) _io.to('admin').emit(event, data); }
function emitDashboard(event, data) { if (_io) _io.to('dashboard').emit(event, data); }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildTopList() {
  return sessionsRepo.listTopBest(10).map((s, i) => ({
    rank: i + 1,
    name: `${s.last_name} ${s.first_name}`,
    totalScore: s.total_score,
    finishedAt: s.finished_at,
  }));
}

export function buildSessionPublic(session) {
  const answered = answersRepo.listBySession(session.id).length;
  const total = session.question_ids_snapshot.length;
  return {
    id: session.id,
    lastName: session.last_name,
    firstName: session.first_name,
    startedAt: session.started_at,
    finishedAt: session.finished_at,
    totalScore: session.total_score,
    progress: { answered, total },
    hiddenFromDashboard: session.hidden_from_dashboard,
  };
}

export function startSession({ lastName, firstName, fingerprint }) {
  const activeQuestions = questionsRepo.listActive();
  if (activeQuestions.length === 0) {
    throw Object.assign(new Error('Нет активных вопросов'), { code: 'validation' });
  }

  const { counts, required } = settingsRepo.getQuizSettings();
  const activeById = new Map(activeQuestions.map(q => [q.id, q]));

  // 1. Обязательные вопросы (идут первыми, в заданном порядке)
  const requiredIds = (required ?? []).filter(id => activeById.has(id));
  const requiredSet = new Set(requiredIds);

  // 2. Пул для рандомных — исключаем уже обязательные
  const poolQuestions = activeQuestions.filter(q => !requiredSet.has(q.id));
  const byType = {};
  for (const q of poolQuestions) {
    if (!byType[q.type]) byType[q.type] = [];
    byType[q.type].push(q);
  }

  // 3. Рандомные по типам в случайном порядке
  const types = Object.keys(counts).filter(t => (counts[t] ?? 0) > 0);
  const randomIds = [];
  for (const type of shuffle(types)) {
    const pool = byType[type] ?? [];
    const need = counts[type] ?? 0;
    randomIds.push(...shuffle(pool).slice(0, need).map(q => q.id));
  }

  const selectedIds = [...requiredIds, ...shuffle(randomIds)];

  if (selectedIds.length === 0) {
    selectedIds.push(...shuffle(activeQuestions).map(q => q.id));
  }

  const sessionId = generateId();
  const session = sessionsRepo.create({ id: sessionId, lastName, firstName, fingerprint, questionIdsSnapshot: selectedIds });
  emitAdmin('players:new', { session: buildSessionPublic(session) });
  return { sessionId, totalQuestions: selectedIds.length, startedAt: session.started_at };
}

export function getCurrentQuestion(sessionId) {
  const session = sessionsRepo.getById(sessionId);
  if (!session) return null;

  if (session.finished_at != null) return buildFinishedResult(session);

  const snapshot = session.question_ids_snapshot;
  const idx = session.current_question_idx;

  if (idx >= snapshot.length) {
    finishSession(sessionId);
    return buildFinishedResult(sessionsRepo.getById(sessionId));
  }

  const qid = snapshot[idx];
  const question = questionsRepo.getById(qid);
  if (!question) throw Object.assign(new Error(`Вопрос ${qid} не найден`), { code: 'internal' });

  const startedAt = answersRepo.touchPending(sessionId, qid);
  const pub = questionTypes[question.type].publicView(question.payload);

  return {
    status: 'in_progress',
    progress: { index: idx, total: snapshot.length },
    question: {
      id: question.id,
      type: question.type,
      title: question.title,
      timeLimitMs: question.time_limit_ms,
      answerDelayMs: question.answer_delay_ms ?? 0,
      startedAt,
      publicView: pub,
    },
  };
}

export function submitAnswer(sessionId, questionId, answerData) {
  const session = sessionsRepo.getById(sessionId);
  if (!session) throw Object.assign(new Error('Сессия не найдена'), { code: 'unauthorized' });
  if (session.finished_at != null) throw Object.assign(new Error('Сессия завершена'), { code: 'session_finished' });

  const snapshot = session.question_ids_snapshot;
  const idx = session.current_question_idx;
  if (snapshot[idx] !== questionId) throw Object.assign(new Error('Неверный questionId'), { code: 'validation' });
  if (answersRepo.existsForSession(sessionId, questionId)) throw Object.assign(new Error('На этот вопрос уже отвечали'), { code: 'already_answered' });

  const question = questionsRepo.getById(questionId);
  const pendingStartedAt = answersRepo.getPendingStartedAt(sessionId, questionId) ?? Date.now();
  const now = Date.now();
  const rawElapsed = now - pendingStartedAt;
  const elapsedMs = Math.min(Math.max(rawElapsed, 0), question.time_limit_ms * 1.5);

  const delayMs = question.answer_delay_ms ?? 0;
  // Elapsed без учёта delay (время читал условие — не считается)
  const effectiveElapsed = Math.max(0, elapsedMs - delayMs);
  const tooLate = rawElapsed > (question.time_limit_ms + delayMs) * 1.5;
  const checkResult = tooLate
    ? { correct: false, partialRatio: 0 }
    : checkers[question.type](question.payload, answerData);

  const { correct, partialRatio } = checkResult;
  const points = calcScore({ baseScore: question.base_score, timeLimitMs: question.time_limit_ms, elapsedMs: effectiveElapsed, correct, partialRatio });

  db.transaction(() => {
    answersRepo.insert({ sessionId, questionId, startedAt: pendingStartedAt, answeredAt: now, elapsedMs: Math.round(elapsedMs), answerData, correct, score: points });
    answersRepo.deletePending(sessionId, questionId);
    sessionsRepo.advanceIndex(sessionId, points);
  })();

  const updatedSession = sessionsRepo.getById(sessionId);
  emitAdmin('players:update', { sessionId, progress: { answered: idx + 1, total: snapshot.length }, totalScore: updatedSession.total_score });

  const isFinished = updatedSession.current_question_idx >= snapshot.length;
  if (isFinished) finishSession(sessionId);

  return { correct, partialRatio, score: points, elapsedMs: Math.round(elapsedMs), next: isFinished ? 'finished' : 'question' };
}

export function finishSession(sessionId) {
  const totalScore = answersRepo.sumScoreForSession(sessionId);
  sessionsRepo.finish(sessionId, totalScore);
  const session = sessionsRepo.getById(sessionId);
  emitAdmin('players:finished', { sessionId, totalScore: session.total_score, finishedAt: session.finished_at });
  emitDashboard('top:update', { top: buildTopList() });
}

function buildFinishedResult(session) {
  const allAnswers = answersRepo.listBySession(session.id);
  // Use best-per-player top for rank/overtaken
  const top = sessionsRepo.listTopBest(10);
  const playerName = `${session.last_name} ${session.first_name}`;
  const rankIdx = top.findIndex((s) => s.last_name === session.last_name && s.first_name === session.first_name);
  const rank = rankIdx >= 0 ? rankIdx + 1 : null;

  const overtaken = rank
    ? top.slice(rankIdx + 1).map(s => ({
        name: `${s.last_name} ${s.first_name}`,
        totalScore: s.total_score,
      }))
    : [];

  return {
    status: 'finished',
    result: {
      lastName: session.last_name,
      firstName: session.first_name,
      totalScore: session.total_score,
      answers: allAnswers.map((a) => ({ questionId: a.question_id, correct: a.correct, score: a.score, elapsedMs: a.elapsed_ms })),
      rank,
      overtaken,
    },
  };
}
