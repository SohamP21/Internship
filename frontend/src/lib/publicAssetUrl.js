/**
 * Backend stores avatar paths like `public/avatars/{id}.png` (served at `/public/...`).
 */
export function publicAssetUrl(storedPath) {
  if (!storedPath) return '';
  const s = String(storedPath).trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const path = s.startsWith('/') ? s : `/${s}`;
  return path;
}
