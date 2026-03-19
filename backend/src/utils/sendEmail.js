import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host:   ENV.EMAIL_HOST,
  port:   ENV.EMAIL_PORT,
  secure: false,
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Eventify" <${ENV.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;