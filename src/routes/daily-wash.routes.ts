import { Router } from 'express';

import { dailyWashController } from '../controllers/daily-wash.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const dailyWashRouter = Router();

dailyWashRouter.use(requireSession);

dailyWashRouter.get('/', dailyWashController.list);
dailyWashRouter.post('/generate', dailyWashController.generate);
dailyWashRouter.post('/:id/start', dailyWashController.start);
dailyWashRouter.post('/:id/complete', dailyWashController.complete);
dailyWashRouter.post('/:id/unavailable', dailyWashController.unavailable);
dailyWashRouter.patch('/:id/slot', dailyWashController.updateSlot);

export default dailyWashRouter;
