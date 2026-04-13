import { Router } from 'express';
import * as assignmentController from './assignment.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize    from '../../middleware/authorize.js';

const router = Router();
router.use(authenticate);

// Coordinator — get full assignment board for an event
router.get(
  '/events/:eventId/board',
  authorize('coordinator'),
  assignmentController.getAssignmentBoard
);

// Coordinator — assign a team to a judge
router.post(
  '/events/:eventId',
  authorize('coordinator'),
  assignmentController.assignTeam
);

// Coordinator — remove an assignment
router.delete(
  '/:assignmentId',
  authorize('coordinator'),
  assignmentController.removeAssignment
);

router.patch(
  '/events/:eventId/registrations/:registrationId/room',
  authorize('coordinator'),
  assignmentController.setRegistrationRoom
);

// Judge — get their assigned teams for an event
router.get(
  '/events/:eventId/my',
  authorize('judge'),
  assignmentController.getMyAssignments
);

export default router;