/**
 * Transactional emails via Nodemailer (Gmail or Microsoft / Outlook — see .env.example).
 * Callers should not rely on email success for core flows.
 */
import fs from 'fs';
import path from 'path';
import User from '../../modules/users/user.model.js';
import { ENV } from '../../config/env.js';
import { sendMail, isMailConfigured, describeMailTransport } from '../../utils/sendMail.js';
import { sendBulkMail } from '../../utils/sendBulkMail.js';

export function isOutgoingEmailConfigured() {
  return isMailConfigured();
}

/** Call once at server startup so missing config is obvious in the terminal. */
export function logOutgoingEmailStatus() {
  const u = ENV.EMAIL_USER?.toLowerCase() || '';
  const pass = ENV.EMAIL_PASS || '';
  const isGmailSender = u.endsWith('@gmail.com') || u.endsWith('@googlemail.com');

  if (isMailConfigured()) {
    console.log(`[email] Outgoing: ${describeMailTransport()}`);
    if (isGmailSender) {
      if (pass.length > 0 && pass.length !== 16) {
        console.warn(
          `[email] Gmail App Passwords are exactly 16 letters (no spaces). EMAIL_PASS has ${pass.length} character(s) — check backend/.env`
        );
      }
      if (/paste|your_|example|changeme|xxxx/i.test(pass) || pass === '') {
        console.warn('[email] Replace EMAIL_PASS with a real Google App Password from myaccount.google.com → Security → App passwords');
      }
    }
    return;
  }
  console.warn(
    '[email] Outgoing: DISABLED. Set EMAIL_USER (Gmail) + EMAIL_PASS (Google App Password) in backend/.env — see .env.example'
  );
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatRoleLabel(role) {
  const r = String(role || 'participant').toLowerCase();
  if (r === 'judge') return 'Judge';
  if (r === 'coordinator') return 'Coordinator';
  return 'Participant';
}

/**
 * Welcome after self-service registration.
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
export async function sendRegistrationWelcomeEmail({ name, email, role }) {
  if (!isOutgoingEmailConfigured()) {
    console.warn('[email] Welcome email skipped: EMAIL_USER / EMAIL_PASS not set in .env');
    return { sent: false, reason: 'email_not_configured' };
  }

  const app = String(ENV.APP_NAME || 'Eventify').trim();
  const safeName = escapeHtml(name);
  const roleLabel = escapeHtml(formatRoleLabel(role));
  const subject = `Welcome to ${app} 🎉`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.55; color: #1e293b;">
  <p>Hi <strong>${safeName}</strong>,</p>
  <p>Welcome to <strong>${escapeHtml(app)}</strong>! Your account is set up as a <strong>${roleLabel}</strong>.</p>
  <p>We are glad you joined. You can sign in anytime with the email you used to register and explore events, assignments, and updates from your dashboard.</p>
  <p style="margin-top: 1.5rem; color: #64748b; font-size: 0.9rem;">— The ${escapeHtml(app)} team</p>
</body>
</html>`.trim();

  const result = await sendMail({ to: email, subject, html });
  return { sent: result.ok };
}

/**
 * When a coordinator creates an event, notify every participant and judge (BCC).
 * Does not await the bulk send — fire-and-forget inside this helper.
 */
export async function notifyParticipantsAndJudgesNewEvent(eventDoc) {
  if (!isMailConfigured()) {
    console.warn('[email] New-event broadcast skipped: EMAIL_USER / EMAIL_PASS not set in .env');
    return { queued: false, reason: 'email_not_configured' };
  }

  const users = await User.find({ role: { $in: ['participant', 'judge'] } })
    .select('email')
    .lean();

  const emails = users
    .map((u) => u.email)
    .filter((e) => e && String(e).includes('@'));

  if (emails.length === 0) {
    return { queued: false, reason: 'no_recipients' };
  }

  sendBulkMail(emails, eventDoc).catch((err) => {
    console.error('[email] new event BCC broadcast failed:', err?.message || err);
  });

  return { queued: true, recipientCount: emails.length };
}

function sanitizeFilenameBase(name) {
  return String(name || 'Event')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'Event';
}

function formatCompletionDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Certificate of participation notice (individual, personalized). Optionally attaches generated PDF.
 * @returns {Promise<{ sent: boolean }>}
 */
export async function sendCertificateEmail({
  toEmail,
  studentName,
  eventName,
  rank,
  certificateId,
  pdfPath,
  completionDate,
}) {
  if (!isOutgoingEmailConfigured()) {
    console.warn('[email] Certificate email skipped: EMAIL_USER / EMAIL_PASS not set');
    return { sent: false };
  }

  const title = String(eventName || 'Event').trim();
  const safeName = escapeHtml(studentName);
  const safeEvent = escapeHtml(title);
  const when = formatCompletionDate(completionDate);
  const safeWhen = escapeHtml(when);
  const safeRank = escapeHtml(rank || 'Participant');
  const safeId = escapeHtml(certificateId);
  const subject = `Certificate of Participation – ${title}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.55; color: #1e293b;">
  <p>Hi <strong>${safeName}</strong>,</p>
  <p>Congratulations on completing <strong>${safeEvent}</strong>!</p>
  <p>Completion date: <strong>${safeWhen}</strong></p>
  <p>Your role / placement: <strong>${safeRank}</strong></p>
  <p>Your certificate will be available in your dashboard.</p>
  <p style="margin-top: 1rem; font-size: 0.85rem; color: #64748b;">Certificate ID: <code>${safeId}</code></p>
</body>
</html>`.trim();

  let attachments;
  if (pdfPath) {
    const abs = path.resolve(process.cwd(), pdfPath);
    if (fs.existsSync(abs)) {
      const attachName = `Certificate-${sanitizeFilenameBase(eventName)}.pdf`;
      attachments = [{ filename: attachName, path: abs }];
    }
  }

  const result = await sendMail({
    to: toEmail,
    subject,
    html,
    attachments,
  });
  return { sent: result.ok };
}
