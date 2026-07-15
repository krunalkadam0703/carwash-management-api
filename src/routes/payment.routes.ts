import { Router } from 'express';

import { paymentController } from '../controllers/payment.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const paymentRouter = Router();

paymentRouter.use(requireSession);

paymentRouter.get('/', paymentController.list);
paymentRouter.post('/subscriptions/:subscriptionId', paymentController.createSubscriptionPayment);
paymentRouter.post('/:id/complete', paymentController.complete);
paymentRouter.post('/:id/fail', paymentController.fail);

export default paymentRouter;
