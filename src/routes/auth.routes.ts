import { Router } from 'express';

import { authController } from '../controllers/auth.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const authRouter = Router();

authRouter.use(requireSession);

authRouter.get('/me', authController.me);
authRouter.post('/onboarding/owner', authController.onboardOwner);
authRouter.post('/onboarding/customer', authController.onboardCustomer);
authRouter.post('/workers', authController.createWorker);

export default authRouter;
