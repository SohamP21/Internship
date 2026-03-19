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
import errorHandler           from './middleware/errorHandler.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Security & Parsing ────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ── Static file serving ───────────────────────────────────────
app.use('/uploads', express.static(path.resolve('uploads')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/judges',        judgeRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/evaluations', evaluationRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'Eventify API running' }));

// ── Central error handler (must be last) ─────────────────────
app.use(errorHandler);

export default app;