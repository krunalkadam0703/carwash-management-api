import { Router } from 'express';

import { subscriptionController } from '../controllers/subscription.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const subscriptionRouter = Router();

subscriptionRouter.use(requireSession);

subscriptionRouter.get('/', subscriptionController.list);
subscriptionRouter.get('/:id', subscriptionController.getById);
subscriptionRouter.post('/', subscriptionController.request);
subscriptionRouter.post('/:id/approve', subscriptionController.approve);
subscriptionRouter.post('/:id/reject', subscriptionController.reject);

export default subscriptionRouter;
