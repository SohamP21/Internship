// Every storage driver must implement these two functions.
// This is the contract — swap local for cloudinary by changing one env var.

/**
 * @param {Express.Multer.File} file
 * @returns {Promise<{ url: string, filename: string }>}
 */
export const uploadFile = async (file) => {
  throw new Error('uploadFile not implemented');
};

/**
 * @param {string} filename
 * @returns {Promise<void>}
 */
export const deleteFile = async (filename) => {
  throw new Error('deleteFile not implemented');
};