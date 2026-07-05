import { Router } from 'express';

import { subscriptionPauseController } from '../controllers/subscription-pause.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const subscriptionPauseRouter = Router();

subscriptionPauseRouter.use(requireSession);

subscriptionPauseRouter.get('/', subscriptionPauseController.list);
subscriptionPauseRouter.post('/', subscriptionPauseController.create);

export default subscriptionPauseRouter;
