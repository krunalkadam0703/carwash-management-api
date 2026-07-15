import { Router } from 'express';

import { workerController } from '../controllers/worker.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const workerRouter = Router();

workerRouter.use(requireSession);

workerRouter.get('/statuses', workerController.listStatuses);
workerRouter.patch('/me/status', workerController.updateMyStatus);
workerRouter.get('/assignments', workerController.listAssignments);
workerRouter.post('/assignments', workerController.assignVehicle);
workerRouter.patch('/assignments/:id', workerController.updateAssignment);

export default workerRouter;
