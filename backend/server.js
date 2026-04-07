console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("CLOUDINARY:", process.env.CLOUDINARY_CLOUD_NAME);
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { ENV } from './src/config/env.js';
import 'dotenv/config';

const start = async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`Eventify server running on port ${ENV.PORT}`);
  });
};

start();