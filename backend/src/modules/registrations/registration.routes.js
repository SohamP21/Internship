import { Router }  from 'express';
import multer      from 'multer';
import path        from 'path';
import * as registrationController from './registration.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize    from '../../middleware/authorize.js';

// ── Multer config ─────────────────────────────────────────────
const storage =
  process.env.STORAGE_DRIVER === 'cloudinary'
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${path.extname(file.originalname)}`);
        },
      });

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.ppt', '.pptx', '.doc', '.docx'];
  const ext     = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed. Allowed: ${allowed.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
});

// PPT and abstract as separate named fields
const uploadFields = upload.fields([
  { name: 'ppt',      maxCount: 1 },
  { name: 'abstract', maxCount: 1 },
]);

const router = Router();
router.use(authenticate);

// Participant registers their team for an event
router.post(
  '/events/:eventId/register',
  authorize('participant'),
  uploadFields,
  registrationController.registerTeam
);

// Participant views their own registrations
router.get(
  '/my',
  authorize('participant'),
  registrationController.getMyRegistrations
);

// Coordinator views all registrations for their event
router.get(
  '/events/:eventId',
  authorize('coordinator'),
  registrationController.getRegistrationsByEvent
);

// Any authenticated user views a single registration (with access check in service)
router.get(
  '/:id',
  registrationController.getRegistrationById
);

export default router;