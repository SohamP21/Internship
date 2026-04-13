import fs from 'fs';
import path from 'path';
import ApiError from './ApiError.js';

const MAX_BYTES = 400 * 1024;

/**
 * Saves a data-URL image to public/avatars/{userId}.{ext}
 * @returns {Promise<string|null>} relative path e.g. public/avatars/xxx.png
 */
export async function saveUserAvatarFromDataUrl(userId, dataUrl) {
  if (dataUrl == null || dataUrl === '') return null;
  const s = String(dataUrl).trim();
  if (!s) return null;
  if (!s.startsWith('data:image/')) {
    throw new ApiError(400, 'Profile photo must be a valid image data URL');
  }
  const match = s.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) {
    throw new ApiError(400, 'Profile photo must be a valid base64 image');
  }
  const extRaw = match[1].toLowerCase();
  const ext = extRaw === 'jpeg' ? 'jpg' : extRaw;
  if (!['png', 'jpg', 'gif', 'webp'].includes(ext)) {
    throw new ApiError(400, 'Use PNG, JPG, GIF, or WebP for profile photo');
  }
  let buf;
  try {
    buf = Buffer.from(match[2], 'base64');
  } catch {
    throw new ApiError(400, 'Invalid image encoding');
  }
  if (buf.length > MAX_BYTES) {
    throw new ApiError(400, 'Profile photo must be under 400KB');
  }

  const dir = path.join(process.cwd(), 'public', 'avatars');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${userId}.${ext}`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, buf);
  return `public/avatars/${filename}`;
}
