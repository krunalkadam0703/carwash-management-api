import { Router, Request, Response } from 'express';
import { ApiResponse } from '../utils/api-response.js';
import { HttpStatus } from '../constants/http.js';
import authRouter from './auth.routes.js';
import complaintRouter from './complaint.routes.js';
import dailyWashRouter from './daily-wash.routes.js';
import dashboardRouter from './dashboard.routes.js';
import imageRouter from './image.routes.js';
import notificationRouter from './notification.routes.js';
import paymentRouter from './payment.routes.js';
import planRouter from './plan.routes.js';
import reportRouter from './report.routes.js';
import serviceRouter from './service.routes.js';
import subscriptionPauseRouter from './subscription-pause.routes.js';
import subscriptionRouter from './subscription.routes.js';
import vehicleTypeRouter from './vehicle-type.routes.js';
import vehicleRouter from './vehicle.routes.js';
import webhookEventRouter from './webhook-event.routes.js';
import workerRouter from './worker.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/complaints', complaintRouter);
apiRouter.use('/daily-washes', dailyWashRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/images', imageRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/vehicle-types', vehicleTypeRouter);
apiRouter.use('/services', serviceRouter);
apiRouter.use('/plans', planRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/vehicles', vehicleRouter);
apiRouter.use('/subscription-pauses', subscriptionPauseRouter);
apiRouter.use('/subscriptions', subscriptionRouter);
apiRouter.use('/webhooks', webhookEventRouter);
apiRouter.use('/workers', workerRouter);

// Base status verification endpoint to test the unified response layout
apiRouter.get('/status', (_req: Request, res: Response) => {
  ApiResponse.success(
    res,
    { uptime: process.uptime() },
    'Carwash core API layer is operational.',
    HttpStatus.OK,
  );
});

// Your future backend feature modules will slide in here cleanly:
// apiRouter.use('/bookings', bookingRouter);
export default apiRouter;
