import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

const fromDisplayName = () => (ENV.EMAIL_FROM_NAME || 'Eventify').trim();

export function isMailConfigured() {
  return Boolean(ENV.EMAIL_USER?.trim() && ENV.EMAIL_PASS?.trim());
}

/**
 * Option B (Gmail): @gmail.com / @googlemail.com always uses smtp.gmail.com so leftover
 * EMAIL_HOST (e.g. Outlook) cannot break sending.
 *
 * Outlook / custom: set EMAIL_HOST or SMTP_HOST. Google Workspace (@company.com): set SMTP_HOST=smtp.gmail.com
 */
export function resolveSmtpTransportOptions() {
  const user = ENV.EMAIL_USER?.trim() || '';
  const pass = ENV.EMAIL_PASS?.trim() || '';
  const lower = user.toLowerCase();
  const isPersonalGmail =
    lower.endsWith('@gmail.com') || lower.endsWith('@googlemail.com');

  if (isPersonalGmail) {
    return {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user, pass },
      tls: { minVersion: 'TLSv1.2' },
    };
  }

  const explicitHost = (
    process.env.SMTP_HOST ||
    process.env.EMAIL_SMTP_HOST ||
    process.env.EMAIL_HOST ||
    ''
  ).trim();

  if (explicitHost) {
    const port = Number(
      process.env.SMTP_PORT || process.env.EMAIL_SMTP_PORT || process.env.EMAIL_PORT || 587
    );
    const secure =
      String(
        process.env.SMTP_SECURE || process.env.EMAIL_SMTP_SECURE || process.env.EMAIL_SECURE || 'false'
      ).toLowerCase() === 'true';
    return { host: explicitHost, port, secure, auth: { user, pass } };
  }

  return { host: 'smtp.office365.com', port: 587, secure: false, auth: { user, pass } };
}

/** For startup logs */
export function describeMailTransport() {
  if (!isMailConfigured()) return 'not configured';
  const user = ENV.EMAIL_USER?.trim().toLowerCase() || '';
  if (user.endsWith('@gmail.com') || user.endsWith('@googlemail.com')) {
    return 'Nodemailer → smtp.gmail.com:587 (Gmail App Password)';
  }
  const explicit =
    (process.env.SMTP_HOST || process.env.EMAIL_SMTP_HOST || process.env.EMAIL_HOST || '').trim();
  if (explicit) return `Nodemailer → ${explicit}:${process.env.EMAIL_PORT || process.env.SMTP_PORT || 587}`;
  return 'Nodemailer → smtp.office365.com:587';
}

export function createMailTransporter() {
  return nodemailer.createTransport(resolveSmtpTransportOptions());
}

/** Shared with sendBulkMail for the same Microsoft SMTP AUTH policy errors. */
export function logSmtpFailureHint(err) {
  const msg = String(err?.message || err || '');
  if (
    msg.includes('SmtpClientAuthentication is disabled') ||
    msg.includes('smtp_auth_disabled') ||
    msg.includes('5.7.139')
  ) {
    console.error(
      '[email] Microsoft blocked SMTP for this mailbox. Use Gmail in .env (Option B): EMAIL_USER=@gmail.com, EMAIL_PASS=Google App Password, remove EMAIL_HOST. See: https://aka.ms/smtp_auth_disabled'
    );
  }
  const user = ENV.EMAIL_USER?.trim().toLowerCase() || '';
  const gmailUser = user.endsWith('@gmail.com') || user.endsWith('@googlemail.com');
  if (
    gmailUser &&
    (msg.includes('Invalid login') ||
      msg.includes('535') ||
      msg.includes('534') ||
      msg.includes('Application-specific password') ||
      msg.includes('Username and Password not accepted'))
  ) {
    console.error(
      '[email] Gmail rejected the sign-in. Check:\n' +
        '  • EMAIL_PASS must be a 16-character Google "App password" (not your normal Gmail password).\n' +
        '  • Google Account → Security → 2-Step Verification ON → App passwords → create one for "Mail".\n' +
        '  • Paste the 16 characters with no spaces into EMAIL_PASS in backend/.env.'
    );
  }
}

/**
 * @param {{ to: string, subject: string, html: string, text?: string, attachments?: import('nodemailer').SendMailOptions['attachments'] }} params
 * @returns {Promise<{ ok: boolean, error?: unknown }>}
 */
export async function sendMail({ to, subject, html, text, attachments }) {
  if (!isMailConfigured()) {
    console.warn(
      '[email] sendMail skipped: set EMAIL_USER (Gmail address) and EMAIL_PASS (Google App Password) in backend/.env — see .env.example'
    );
    return { ok: false };
  }

  try {
    const transporter = createMailTransporter();
    await transporter.sendMail({
      from: `"${fromDisplayName()}" <${ENV.EMAIL_USER.trim()}>`,
      to,
      subject,
      html,
      text: text || undefined,
      attachments: attachments?.length ? attachments : undefined,
    });
    return { ok: true };
  } catch (err) {
    console.error('[email] sendMail failed:', err?.message || err);
    logSmtpFailureHint(err);
    return { ok: false, error: err };
  }
}
