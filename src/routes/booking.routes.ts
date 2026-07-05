import { Router } from 'express';

import { bookingController } from '../controllers/booking.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const bookingRouter = Router();

bookingRouter.use(requireSession);

bookingRouter.get('/', bookingController.list);
bookingRouter.post('/', bookingController.create);
bookingRouter.post('/:id/assign', bookingController.assign);
bookingRouter.post('/:id/start', bookingController.start);
bookingRouter.post('/:id/complete', bookingController.complete);
bookingRouter.post('/:id/cancel', bookingController.cancel);
bookingRouter.post('/:id/rate', bookingController.rate);

export default bookingRouter;
