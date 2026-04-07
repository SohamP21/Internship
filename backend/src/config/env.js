import dotenv from 'dotenv';
dotenv.config();

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
  // Optional until email features are wired up (see sendEmail.js)
  EMAIL_HOST:     process.env.EMAIL_HOST || '',
  EMAIL_PORT:     Number(process.env.EMAIL_PORT) || 587,
  EMAIL_USER:     process.env.EMAIL_USER || '',
  EMAIL_PASS:     process.env.EMAIL_PASS || '',
  CLIENT_URL:     process.env.CLIENT_URL || 'http://localhost:5173',
  // Judge authorization + single hardcoded admin account
  JUDGE_ACCESS_CODE: process.env.JUDGE_ACCESS_CODE || 'JUDGE2026',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@eventify.local',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@12345',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Eventify Admin',
};