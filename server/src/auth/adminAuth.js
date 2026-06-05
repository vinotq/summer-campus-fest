import crypto from 'crypto';
import { config } from '../config.js';
import { sign, verify } from '../utils/hmac.js';

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, dkLen: 32 };

export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(plain, salt, SCRYPT_PARAMS.dkLen, {
    N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p,
  });
  // Используем ':' как разделитель — '$' вызывает проблемы с переменными окружения в docker-compose
  return `scrypt:${salt}:${key.toString('base64url')}`;
}

export function verifyPassword(plain, hash) {
  const parts = hash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64url');
  try {
    const actual = crypto.scryptSync(plain, salt, expected.length, {
      N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p,
    });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function issueCookie(reply) {
  const token = sign({ kind: 'admin', iat: Date.now() });
  reply.setCookie(config.adminCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 3600,
  });
}

export function clearCookie(reply) {
  reply.clearCookie(config.adminCookieName, { path: '/' });
}

export async function requireAdmin(request, reply) {
  const token = request.cookies[config.adminCookieName];
  const payload = verify(token);
  if (!payload || payload.kind !== 'admin') {
    return reply.code(401).send({ error: 'unauthorized', message: 'Требуется авторизация администратора' });
  }
  if (Date.now() - payload.iat > 12 * 3600 * 1000) {
    return reply.code(401).send({ error: 'unauthorized', message: 'Сессия истекла' });
  }
}
