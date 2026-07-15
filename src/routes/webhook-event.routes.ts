import { Router } from 'express';

import { webhookEventController } from '../controllers/webhook-event.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const webhookEventRouter = Router();

webhookEventRouter.post('/razorpay', webhookEventController.ingestRazorpay);

webhookEventRouter.use(requireSession);

webhookEventRouter.get('/razorpay/events', webhookEventController.list);
webhookEventRouter.patch('/razorpay/events/:id/processed', webhookEventController.markProcessed);
webhookEventRouter.patch('/razorpay/events/:id/failed', webhookEventController.markFailed);

export default webhookEventRouter;
