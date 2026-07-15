import { Router } from 'express';

import { reportController } from '../controllers/report.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const reportRouter = Router();

reportRouter.use(requireSession);

reportRouter.get('/owner/summary', reportController.ownerSummary);

export default reportRouter;
