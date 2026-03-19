import { Router } from 'express';
import * as eventController from './event.controller.js';
import authenticate         from '../../middleware/authenticate.js';
import authorize            from '../../middleware/authorize.js';
import validate             from '../../middleware/validate.js';
import { createEventSchema, updateStatusSchema } from './event.validation.js';

const router = Router();

// All event routes require login
router.use(authenticate);

// Any logged-in user can list and view events
router.get('/',     eventController.getAllEvents);
router.get('/:id',  eventController.getEventById);

// Coordinator-only routes
router.post(
  '/',
  authorize('coordinator'),
  validate(createEventSchema),
  eventController.createEvent
);

router.put(
  '/:id',
  authorize('coordinator'),
  eventController.updateEvent
);

router.patch(
  '/:id/status',
  authorize('coordinator'),
  validate(updateStatusSchema),
  eventController.transitionStatus
);

router.delete(
  '/:id',
  authorize('coordinator'),
  eventController.deleteEvent
);

export default router;