import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CERT_DIR = path.join(PROJECT_ROOT, 'public', 'certificates');

export function ensurePublicCertificatesDir() {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

/**
 * @param {{ studentName: string, eventName: string, eventDate: Date|string, rank?: string, certificateId: string, coordinatorName?: string }}
 * @returns {Promise<string>} relative path stored in DB: public/certificates/[id].pdf
 */
export function generateCertificatePdf({
  studentName,
  eventName,
  eventDate,
  rank,
  certificateId,
  coordinatorName = 'Event Coordinator',
}) {
  ensurePublicCertificatesDir();

  const outPath = path.join(CERT_DIR, `${certificateId}.pdf`);
  const relPath = `public/certificates/${certificateId}.pdf`;

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0,
    info: { Title: `Certificate — ${eventName}`, Author: 'Eventify' },
  });

  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  const W = 842;
  const H = 595;
  const bg = '#1a2030';
  const green = '#4ade80';
  const muted = '#94a3b8';
  const dim = '#475569';
  const white = '#ffffff';
  const orange = '#f97316';

  doc.rect(0, 0, W, H).fill(bg);

  // Double-line decorative border inset 20px
  doc.strokeColor(green).lineWidth(2);
  doc.rect(20, 20, W - 40, H - 40).stroke();
  doc.rect(26, 26, W - 52, H - 52).stroke();

  const cx = W / 2;
  let y = 52;

  doc.fillColor(muted).font('Helvetica').fontSize(14).text('CERTIFICATE OF', cx, y, {
    align: 'center',
    characterSpacing: 4,
  });
  y += 24;

  const rankStr = rank != null ? String(rank).trim() : '';
  const headline = rankStr && rankStr !== 'Participant' ? 'ACHIEVEMENT' : 'PARTICIPATION';
  doc.fillColor(white).font('Helvetica-Bold').fontSize(42).text(headline, cx, y, { align: 'center' });
  y += 48;

  doc.strokeColor(green).lineWidth(1).moveTo(cx - 100, y).lineTo(cx + 100, y).stroke();
  y += 28;

  doc.fillColor(muted).font('Helvetica').fontSize(13).text('This is to certify that', cx, y, { align: 'center' });
  y += 24;

  doc.fillColor(white).font('Helvetica-Bold').fontSize(36).text(String(studentName || 'Student'), cx, y, {
    align: 'center',
  });
  y += 42;

  doc.fillColor(muted).font('Helvetica').fontSize(13).text('has successfully participated in', cx, y, {
    align: 'center',
  });
  y += 22;

  doc.fillColor(green).font('Helvetica-Bold').fontSize(24).text(String(eventName || 'Event'), cx, y, {
    align: 'center',
  });
  y += 32;

  const dateStr =
    eventDate instanceof Date
      ? eventDate.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : String(eventDate || '');
  doc.fillColor(muted).font('Helvetica').fontSize(13).text(`held on ${dateStr}`, cx, y, { align: 'center' });
  y += 38;

  if (rankStr) {
    const boxW = 240;
    const boxH = 34;
    const bx = cx - boxW / 2;
    doc.roundedRect(bx, y, boxW, boxH, 6).fill('#2d3b4f');
    doc.roundedRect(bx, y, boxW, boxH, 6).strokeColor(orange).lineWidth(1).stroke();
    doc.fillColor(orange).font('Helvetica-Bold').fontSize(12).text(`Rank: ${rankStr}`, cx, y + 10, {
      align: 'center',
    });
    y += boxH + 24;
  } else {
    y += 12;
  }

  doc.fillColor(dim).font('Helvetica').fontSize(9).text(`Certificate ID: ${certificateId}`, 40, H - 42, {
    width: 300,
    align: 'left',
  });
  doc.fillColor(dim).font('Helvetica').fontSize(9).text('Eventify — College Event Platform', W - 40, H - 42, {
    width: 280,
    align: 'right',
  });

  const sigY = H - 78;
  doc.strokeColor(muted).lineWidth(0.5).moveTo(cx - 120, sigY).lineTo(cx + 120, sigY).stroke();
  doc.fillColor(muted).font('Helvetica').fontSize(9).text(String(coordinatorName), cx, sigY + 6, { align: 'center' });
  doc.fillColor(dim).font('Helvetica').fontSize(9).text('Event Coordinator', cx, sigY + 18, { align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log('[certificate] PDF generated:', relPath);
      resolve(relPath);
    });
    stream.on('error', (err) => {
      console.error('[certificate] PDF write failed:', err?.message || err);
      reject(err);
    });
  });
}
