import { config } from '../config.js';
import { sign, verify } from '../utils/hmac.js';
import * as sessionsRepo from '../db/repo/sessions.js';

export function issueSessionCookie(reply, sessionId) {
  const token = sign({ kind: 'player', sid: sessionId, iat: Date.now() });
  reply.setCookie(config.sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 3600,
  });
}

export function clearSessionCookie(reply) {
  reply.clearCookie(config.sessionCookieName, { path: '/' });
}

export function getSessionId(request) {
  const token = request.cookies[config.sessionCookieName];
  const payload = verify(token);
  if (!payload || payload.kind !== 'player') return null;
  return payload.sid;
}

export async function requirePlayer(request, reply) {
  const sid = getSessionId(request);
  if (!sid) {
    return reply.code(401).send({ error: 'unauthorized', message: 'Сессия не найдена' });
  }
  const session = sessionsRepo.getById(sid);
  if (!session) {
    return reply.code(401).send({ error: 'unauthorized', message: 'Сессия не найдена' });
  }
  request.session = session;
}
