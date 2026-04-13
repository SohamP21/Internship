import { Router } from 'express';
import authenticate from '../../middleware/authenticate.js';
import validate from '../../middleware/validate.js';
import { updateProfileSchema } from './user.validation.js';
import * as userController from './user.controller.js';

const router = Router();

router.patch('/profile', authenticate, validate(updateProfileSchema), userController.updateProfile);

export default router;
