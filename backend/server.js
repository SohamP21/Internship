import app from './src/app.js';
import connectDB from './src/config/db.js';
import { ENV } from './src/config/env.js';
import { ensurePublicCertificatesDir } from './src/utils/certificateGenerator.js';
import { logOutgoingEmailStatus } from './src/services/email/mailNotifications.js';

const start = async () => {
  ensurePublicCertificatesDir();
  logOutgoingEmailStatus();
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`Eventify server running on port ${ENV.PORT}`);
  });
};

start();