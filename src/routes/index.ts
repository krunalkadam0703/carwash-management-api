import { Router, Request, Response } from 'express';
import { ApiResponse } from '../utils/api-response.js';
import { HttpStatus } from '../constants/http.js';
import authRouter from './auth.routes.js';
import serviceRouter from './service.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/services', serviceRouter);

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
// apiRouter.use('/notifications', notificationRouter);

export default apiRouter;
