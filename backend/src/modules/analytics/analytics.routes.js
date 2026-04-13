import { Router } from 'express';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import * as analyticsController from './analytics.controller.js';

const router = Router();
router.use(authenticate, authorize('coordinator'));

router.get('/overview', analyticsController.getOverview);

export default router;
