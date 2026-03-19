import app from './src/app.js';
import connectDB from './src/config/db.js';
import { ENV } from './src/config/env.js';

const start = async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`Eventify server running on port ${ENV.PORT}`);
  });
};

start();