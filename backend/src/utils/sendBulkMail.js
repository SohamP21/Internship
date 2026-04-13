import { ENV } from '../config/env.js';
import { createMailTransporter, isMailConfigured, logSmtpFailureHint } from './sendMail.js';

const fromName = () => (ENV.EMAIL_FROM_NAME || 'Eventify').trim();

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatEventDate(d) {
  if (!d) return 'To be announced';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'To be announced';
  }
}

function buildAnnouncementHtml(eventDoc) {
  const title = String(eventDoc?.title || 'New event').trim();
  const safeTitle = escapeHtml(title);
  const desc = eventDoc?.description ? String(eventDoc.description).trim() : '';
  const safeDesc = escapeHtml(desc);
  const regDeadline = formatEventDate(eventDoc?.registrationDeadline);
  const start = formatEventDate(eventDoc?.eventStartDate);
  const end = formatEventDate(eventDoc?.eventEndDate);
  const baseUrl = (ENV.CLIENT_URL || '').replace(/\/$/, '');
  const signInLine = baseUrl
    ? `You can <a href="${escapeHtml(baseUrl)}" style="color:#2563eb;">sign in here</a> to view details and register.`
    : 'Sign in to your dashboard to view details and register.';

  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.55; color: #1e293b;">
  <p>Hello,</p>
  <p>A new event has been announced on <strong>${escapeHtml(fromName())}</strong>:</p>
  <h2 style="margin: 0.5rem 0; color: #0f172a;">${safeTitle}</h2>
  ${desc ? `<p style="white-space: pre-wrap;">${safeDesc}</p>` : ''}
  <ul style="padding-left: 1.25rem; color: #334155;">
    <li><strong>Start date:</strong> ${escapeHtml(start)}</li>
    <li><strong>End date:</strong> ${escapeHtml(end)}</li>
    <li><strong>Registration deadline:</strong> ${escapeHtml(regDeadline)}</li>
  </ul>
  <p style="margin-top: 1.25rem;">${signInLine}</p>
  <p style="margin-top: 1.5rem; color: #64748b; font-size: 0.9rem;">— ${escapeHtml(fromName())}</p>
</body>
</html>`.trim();
}

/**
 * One message, all recipients in BCC (recipients do not see each other).
 * @param {string[]} emails
 * @param {object} eventDoc — saved event (title, description, dates)
 */
export async function sendBulkMail(emails, eventDoc) {
  try {
    const list = (emails || [])
      .map((e) => String(e || '').trim().toLowerCase())
      .filter((e) => e.includes('@'));
    if (list.length === 0) return;

    if (!isMailConfigured()) {
      console.warn('[email] sendBulkMail skipped: set EMAIL_USER and EMAIL_PASS in .env');
      return;
    }

    const user = ENV.EMAIL_USER.trim();
    const title = String(eventDoc?.title || 'New event').trim();
    const subject = `New Event Announced: ${title}`;
    const html = buildAnnouncementHtml(eventDoc);

    const transporter = createMailTransporter();

    await transporter.sendMail({
      from: `"${fromName()}" <${user}>`,
      to: user,
      bcc: list,
      subject,
      html,
    });
  } catch (err) {
    console.error('[email] sendBulkMail failed:', err?.message || err);
    logSmtpFailureHint(err);
  }
}
