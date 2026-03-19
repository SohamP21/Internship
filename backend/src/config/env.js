import dotenv from 'dotenv';
dotenv.config();

const _required = (key) => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
  return process.env[key];
};

export const ENV = {
  PORT:           process.env.PORT || 5000,
  MONGO_URI:      _required('MONGO_URI'),
  JWT_SECRET:     _required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  EMAIL_HOST:     _required('EMAIL_HOST'),
  EMAIL_PORT:     process.env.EMAIL_PORT || 587,
  EMAIL_USER:     _required('EMAIL_USER'),
  EMAIL_PASS:     _required('EMAIL_PASS'),
  CLIENT_URL:     process.env.CLIENT_URL || 'http://localhost:5173',
};