import 'dotenv/config';
import path from 'path';

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const DATA_DIR = process.env.DATA_DIR || './data';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',

  dataDir: DATA_DIR,
  dbPath: process.env.DB_FILE || path.join(DATA_DIR, 'db.sqlite'),
  uploadsDir: process.env.UPLOADS_DIR || path.join(DATA_DIR, 'uploads'),
  uploadMaxBytes: parseInt(process.env.UPLOAD_MAX_BYTES || '5242880', 10),

  adminLogin: required('ADMIN_LOGIN'),
  adminPasswordHash: required('ADMIN_PASSWORD_HASH'),
  cookieSecret: required('COOKIE_SECRET'),

  sessionCookieName: 'cf_sid',
  adminCookieName: 'cf_admin',

  get isDev() {
    return this.nodeEnv === 'development';
  },
};

if (config.cookieSecret.length < 32) {
  throw new Error('COOKIE_SECRET must be at least 32 characters');
}
