import { Router } from 'express';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import * as certificateController from './certificate.controller.js';

const router = Router();

router.get('/verify/:certificateId', certificateController.verifyCertificate);

router.get('/my', authenticate, authorize('participant'), certificateController.getMyCertificates);

router.get(
  '/download/:certificateId',
  authenticate,
  authorize('participant'),
  certificateController.downloadCertificate
);

export default router;
