import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

const transporter =
  ENV.EMAIL_HOST && ENV.EMAIL_USER
    ? nodemailer.createTransport({
        host: ENV.EMAIL_HOST,
        port: ENV.EMAIL_PORT,
        secure: false,
        auth: {
          user: ENV.EMAIL_USER,
          pass: ENV.EMAIL_PASS,
        },
      })
    : null;

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    throw new Error('Email is not configured (set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env)');
  }
  await transporter.sendMail({
    from: `"Eventify" <${ENV.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;