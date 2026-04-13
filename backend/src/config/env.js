import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Always load backend/.env from this file's location — cwd-independent (fixes "injecting env (0)"
// when npm/concurrently runs from the repo root).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..', '..');
const envPath = path.join(backendRoot, '.env');
// Prefer file over pre-set (possibly empty) shell vars — avoids wrong Gmail login.
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  if (result.error.code === 'ENOENT') {
    console.warn(`[env] No .env file at:\n    ${envPath}`);
    console.warn('[env] Copy backend/.env.example to backend/.env or set env vars on the host.');
  } else {
    console.warn('[env] Could not read .env:', result.error.message);
  }
} else if (result.parsed) {
  const n = Object.keys(result.parsed).length;
  if (n === 0) {
    console.warn(`[env] ${path.basename(envPath)} has no KEY=value lines (file empty?).`);
  } else {
    console.log(`[env] Loaded ${n} variable(s) from ${path.basename(envPath)}`);
  }
}

const _required = (key) => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
  return process.env[key];
};

export const ENV = {
  NODE_ENV:       process.env.NODE_ENV || 'development',
  IS_PRODUCTION:  process.env.NODE_ENV === 'production',
  PORT:           process.env.PORT || 5000,
  MONGO_URI:      _required('MONGO_URI'),
  JWT_SECRET:     _required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  EMAIL_USER:     (process.env.EMAIL_USER || '').trim(),
  EMAIL_PASS:     String(process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim(),
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Eventify',
  APP_NAME:       process.env.APP_NAME || 'Eventify',
  CLIENT_URL:     process.env.CLIENT_URL || 'http://localhost:5173',
  JUDGE_ACCESS_CODE: process.env.JUDGE_ACCESS_CODE || 'JUDGE2026',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@eventify.local',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@12345',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Eventify Admin',
};
