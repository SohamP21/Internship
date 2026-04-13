const GITHUB_PREFIX = 'https://github.com/';
const DRIVE_PREFIX = 'https://drive.google.com/';

export function isValidGithubUrl(url) {
  const u = String(url || '').trim();
  if (!u) return true;
  return u.startsWith(GITHUB_PREFIX);
}

export function isValidDriveUrl(url) {
  const u = String(url || '').trim();
  if (!u) return true;
  return u.startsWith(DRIVE_PREFIX);
}

export function assertProjectLinks(githubLink, driveLink) {
  if (!isValidGithubUrl(githubLink)) {
    const err = new Error('GitHub link must start with https://github.com/');
    err.statusCode = 400;
    throw err;
  }
  if (!isValidDriveUrl(driveLink)) {
    const err = new Error('Google Drive link must start with https://drive.google.com/');
    err.statusCode = 400;
    throw err;
  }
}
