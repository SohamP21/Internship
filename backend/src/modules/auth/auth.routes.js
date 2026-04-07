import { Router } from 'express';
import * as authController from './auth.controller.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import { registerSchema, loginSchema, updateMeSchema } from './auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login',     validate(loginSchema),   authController.login);
router.get('/me',         authenticate,            authController.getMe);
router.patch('/me',       authenticate, validate(updateMeSchema), authController.updateMe);

export default router;