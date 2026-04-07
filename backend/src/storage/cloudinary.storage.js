import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// 🔧 Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔍 Helper to detect file type
const getResourceType = (filename = '') => {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') return 'image';   // 🔥 IMPORTANT FIX
  return 'auto';
};

// 📤 Upload from buffer
const uploadFromBuffer = async (buffer, filename) =>
  new Promise((resolve, reject) => {
    const resourceType = getResourceType(filename);

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || 'eventify_uploads',
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        filename_override: filename,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    stream.end(buffer);
  });

// 📤 Main upload function
export const uploadFile = async (file) => {
  let result;
  const filename = file?.originalname || '';

  const resourceType = getResourceType(filename);

  if (file?.buffer) {
    result = await uploadFromBuffer(file.buffer, filename);
  } else if (file?.path) {
    result = await cloudinary.uploader.upload(file.path, {
      folder: process.env.CLOUDINARY_FOLDER || 'eventify_uploads',
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    });

    // 🧹 cleanup local file
    try {
      fs.unlinkSync(file.path);
    } catch {
      // ignore
    }
  } else {
    throw new Error('No file buffer/path found for Cloudinary upload');
  }

  return {
    url: result.secure_url,
    filename: result.public_id,
    resource_type: result.resource_type, // optional (useful for debugging)
  };
};

// ❌ Delete file (fixed)
export const deleteFile = async (filename, resourceType = 'auto') => {
  if (!filename) return;

  await cloudinary.uploader.destroy(filename, {
    resource_type: resourceType, // 🔥 FIXED
  });
};