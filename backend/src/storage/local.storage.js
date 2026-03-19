import path from 'path';
import fs   from 'fs';
import { ENV } from '../config/env.js';

// Resolves to backend/uploads/
const UPLOAD_DIR = path.resolve('uploads');

// Ensure the folder exists on startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadFile = async (file) => {
  // Multer has already written the file to disk at file.path
  // We just return the public URL and stored filename
  const filename = file.filename;
  const url      = `${ENV.CLIENT_URL.replace('5173', '5000')}/uploads/${filename}`;
  return { url, filename };
};

export const deleteFile = async (filename) => {
  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};