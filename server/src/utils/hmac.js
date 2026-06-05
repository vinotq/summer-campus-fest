import crypto from 'crypto';
import { config } from '../config.js';

function b64url(str) {
  return Buffer.from(str).toString('base64url');
}

function fromB64url(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

export function sign(payload) {
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', config.cookieSecret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', config.cookieSecret).update(payloadB64).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    return JSON.parse(fromB64url(payloadB64));
  } catch {
    return null;
  }
}
