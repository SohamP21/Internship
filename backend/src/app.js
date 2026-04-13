import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import morgan  from 'morgan';
import { fileURLToPath } from 'url';
import path from 'path';

import { ENV }                from './config/env.js';
import authRoutes             from './modules/auth/auth.routes.js';
import eventRoutes            from './modules/events/event.routes.js';
import registrationRoutes     from './modules/registrations/registration.routes.js';
import judgeRoutes            from './modules/judges/judge.routes.js';
import assignmentRoutes from './modules/assignments/assignment.routes.js';
import evaluationRoutes from './modules/evaluations/evaluation.routes.js';
import certificateRoutes from './modules/certificates/certificate.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import userRoutes from './modules/users/user.routes.js';
import errorHandler           from './middleware/errorHandler.js';
import { ensurePublicCertificatesDir } from './utils/certificateGenerator.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

ensurePublicCertificatesDir();

// ── Security & Parsing ────────────────────────────────────────
app.use(helmet());
// In development, reflect any browser origin so localhost / 127.0.0.1 / any Vite port work with credentials.
app.use(
  cors({
    origin: ENV.IS_PRODUCTION ? ENV.CLIENT_URL : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// ── Static file serving ───────────────────────────────────────
app.use('/uploads', express.static(path.resolve('uploads')));
app.use('/public', express.static(path.resolve('public')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/judges',        judgeRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'Eventify API running' }));

// ── Central error handler (must be last) ─────────────────────
app.use(errorHandler);

export default app;