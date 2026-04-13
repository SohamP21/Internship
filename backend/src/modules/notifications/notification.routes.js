import { Router } from 'express';
import authenticate from '../../middleware/authenticate.js';
import * as notificationController from './notification.controller.js';

const router = Router();
router.use(authenticate);

router.get('/recent', notificationController.getRecent);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markOneRead);

export default router;
