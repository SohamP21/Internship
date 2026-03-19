// To switch to cloud later: set STORAGE_DRIVER=cloudinary in .env
// Everything else in the codebase stays the same.

import * as localDriver     from '../storage/local.storage.js';
import * as cloudinaryDriver from '../storage/cloudinary.storage.js';

const driver = process.env.STORAGE_DRIVER === 'cloudinary'
  ? cloudinaryDriver
  : localDriver;

export const uploadFile = driver.uploadFile;
export const deleteFile = driver.deleteFile;