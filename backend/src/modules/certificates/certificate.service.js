import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import Registration from '../registrations/registration.model.js';
import Event from '../events/event.model.js';
import Certificate from './certificate.model.js';
import { buildRegistrationRankMapForEvent } from '../evaluations/evaluation.service.js';
import { generateCertificatePdf } from '../../utils/certificateGenerator.js';
import { sendCertificateEmail } from '../../services/email/mailNotifications.js';

/** Team lead + members (deduped by email) for certificate notifications. */
function certificateRecipientsForRegistration(reg, teamLead) {
  const out = [];
  const seen = new Set();
  const push = (email, name) => {
    const e = String(email || '').trim().toLowerCase();
    if (!e || !e.includes('@') || seen.has(e)) return;
    seen.add(e);
    out.push({ email: e, name: String(name || 'Participant').trim() || 'Participant' });
  };

  if (teamLead?.email) push(teamLead.email, teamLead.name || 'Student');
  for (const m of reg.members || []) {
    push(m.email, m.name);
  }
  return out;
}

async function processOneStudentCertificate({
  reg,
  eventId,
  eventName,
  eventDate,
  completionDate,
  rank,
  coordinatorName,
}) {
  const student = reg.teamLeadId;
  if (!student?._id) {
    console.error('[certificate] failure: missing team lead user', reg._id?.toString?.());
    return { status: 'failed', step: 'no_student' };
  }

  const studentId = student._id;
  const existing = await Certificate.findOne({ studentId, eventId });
  if (existing) {
    console.log('[certificate] skip: already exists', existing.certificateId, studentId.toString());
    return { status: 'skipped' };
  }

  const recipients = certificateRecipientsForRegistration(reg, student);
  if (recipients.length === 0) {
    console.error('[certificate] failure: no emails on team lead or members', studentId.toString());
    return { status: 'failed', step: 'no_email' };
  }

  const certificateId = crypto.randomUUID();
  let pdfPath;
  try {
    pdfPath = await generateCertificatePdf({
      studentName: student.name || 'Student',
      eventName,
      eventDate,
      rank,
      certificateId,
      coordinatorName,
    });
  } catch (err) {
    console.error('[certificate] failure: PDF', certificateId, err?.message || err);
    return { status: 'failed', step: 'pdf' };
  }

  try {
    await Certificate.create({
      studentId,
      eventId,
      studentName: student.name || 'Student',
      eventName,
      eventDate: new Date(eventDate),
      rank,
      certificateId,
      pdfPath,
    });
    console.log('[certificate] success: saved', certificateId);
  } catch (err) {
    if (err?.code === 11000) {
      console.log('[certificate] skip: duplicate race', certificateId);
      return { status: 'skipped' };
    }
    console.error('[certificate] failure: database', certificateId, err?.message || err);
    try {
      fs.unlinkSync(path.resolve(process.cwd(), pdfPath));
    } catch {
      /* ignore */
    }
    return { status: 'failed', step: 'db' };
  }

  try {
    let anySent = false;
    for (const { email, name } of recipients) {
      const { sent } = await sendCertificateEmail({
        toEmail: email,
        studentName: name,
        eventName,
        rank,
        certificateId,
        pdfPath,
        completionDate,
      });
      if (sent) anySent = true;
      else console.error('[certificate] email failed for', email, certificateId);
    }
    if (!anySent) {
      console.error('[certificate] failure: no certificate email delivered', certificateId);
      return { status: 'failed', step: 'email' };
    }
    console.log('[certificate] success: certificate emailed to', recipients.length, 'recipient(s)', certificateId);
  } catch (err) {
    console.error('[certificate] failure: email', certificateId, err?.message || err);
    return { status: 'failed', step: 'email' };
  }

  return { status: 'issued' };
}

/**
 * After an event is marked completed: PDF + DB + email per registered team lead.
 * @returns {Promise<{ attempted: number, issued: number, skipped: number, failed: number }>}
 */
export async function issueCertificatesForCompletedEvent(eventDoc) {
  const eventId = eventDoc?._id ?? eventDoc;
  const event = await Event.findById(eventId).populate('coordinatorId', 'name');

  if (!event?._id) {
    console.error('[certificate] issueCertificatesForCompletedEvent: event not found');
    return { attempted: 0, issued: 0, skipped: 0, failed: 0 };
  }

  const coordinatorName = event.coordinatorId?.name || 'Event Coordinator';

  const rankMap = await buildRegistrationRankMapForEvent(eventId);
  const registrations = await Registration.find({ eventId }).populate('teamLeadId', 'name email');

  const eventName = event.title || 'Event';
  const eventDate = event.eventEndDate || event.eventStartDate || new Date();
  const completionDate = new Date();

  const attempted = registrations.length;

  const jobs = registrations.map((reg) => {
    const rank = rankMap.get(reg._id.toString()) || 'Participant';
    return processOneStudentCertificate({
      reg,
      eventId,
      eventName,
      eventDate,
      completionDate,
      rank,
      coordinatorName,
    });
  });

  const settled = await Promise.allSettled(jobs);

  let issued = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of settled) {
    if (r.status === 'rejected') {
      failed += 1;
      console.error('[certificate] failure: promise rejected', r.reason);
      continue;
    }
    const v = r.value?.status;
    if (v === 'issued') issued += 1;
    else if (v === 'skipped') skipped += 1;
    else failed += 1;
  }

  console.log('[certificate] batch finished', { attempted, issued, skipped, failed });
  return { attempted, issued, skipped, failed };
}

export async function listCertificatesForStudent(studentId) {
  return Certificate.find({ studentId })
    .sort({ issuedAt: -1 })
    .lean();
}

export async function getCertificateByPublicId(certificateId) {
  return Certificate.findOne({ certificateId }).lean();
}

export async function getCertificateFilePathForOwner(certificateId, studentId) {
  const cert = await Certificate.findOne({ certificateId });
  if (!cert) return null;
  if (!cert.studentId.equals(studentId)) return null;
  const abs = path.resolve(process.cwd(), cert.pdfPath);
  if (!fs.existsSync(abs)) return null;
  return { cert, absPath: abs };
}
