import { Router }   from 'express';
import * as judgeController from './judge.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize    from '../../middleware/authorize.js';
import validate     from '../../middleware/validate.js';
import { judgeOnboardSchema } from './judge.validation.js';

const router = Router();
router.use(authenticate);

// Judge signs up for an event
router.post(
  '/events/:eventId/onboard',
  authorize('judge'),
  validate(judgeOnboardSchema),
  judgeController.onboardJudge
);

// Judge views all events they signed up for
router.get(
  '/my',
  authorize('judge'),
  judgeController.getMyProfiles
);

// Judge checks their profile for a specific event
router.get(
  '/events/:eventId/my-profile',
  authorize('judge'),
  judgeController.getMyProfileForEvent
);

// Coordinator views all judges for their event
router.get(
  '/events/:eventId',
  authorize('coordinator'),
  judgeController.getJudgesByEvent
);

export default router;