import { Router } from 'express';
import * as evaluationController from './evaluation.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize    from '../../middleware/authorize.js';
import validate     from '../../middleware/validate.js';
import { submitEvaluationSchema } from './evaluation.validation.js';

const router = Router();
router.use(authenticate);

// Judge — submit evaluation for an assignment
router.post(
  '/assignments/:assignmentId',
  authorize('judge'),
  validate(submitEvaluationSchema),
  evaluationController.submitEvaluation
);

// Judge — get their assigned teams + evaluation status for an event
router.get(
  '/events/:eventId/my-assignments',
  authorize('judge'),
  evaluationController.getJudgeAssignmentsWithStatus
);

// Judge — view their submitted evaluation for an assignment
router.get(
  '/assignments/:assignmentId/my',
  authorize('judge'),
  evaluationController.getEvaluationByAssignment
);

// Coordinator — get aggregated results for an event
router.get(
  '/events/:eventId/results',
  authorize('coordinator'),
  evaluationController.getEventResults
);

// Participant — get their own score for a registration
router.get(
  '/registrations/:registrationId/my-score',
  authorize('participant'),
  evaluationController.getMyScore
);

export default router;