// To switch to cloud later: set STORAGE_DRIVER=cloudinary in .env
// Everything else in the codebase stays the same.

import * as localDriver     from '../storage/local.storage.js';
import * as cloudinaryDriver from '../storage/cloudinary.storage.js';

const hasCloudinaryCreds =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

const useCloudinary =
  process.env.STORAGE_DRIVER === 'cloudinary' ||
  (process.env.STORAGE_DRIVER !== 'local' && hasCloudinaryCreds);

const driver = useCloudinary ? cloudinaryDriver : localDriver;

export const uploadFile = driver.uploadFile;
export const deleteFile = driver.deleteFile;