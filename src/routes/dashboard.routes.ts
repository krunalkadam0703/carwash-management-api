import { Router } from 'express';

import { dashboardController } from '../controllers/dashboard.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const dashboardRouter = Router();

dashboardRouter.use(requireSession);

dashboardRouter.get('/owner/summary', dashboardController.ownerSummary);
dashboardRouter.get('/customer/summary', dashboardController.customerSummary);

export default dashboardRouter;
