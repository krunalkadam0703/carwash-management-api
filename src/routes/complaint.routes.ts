import { Router } from 'express';

import { complaintController } from '../controllers/complaint.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const complaintRouter = Router();

complaintRouter.use(requireSession);

complaintRouter.get('/', complaintController.list);
complaintRouter.post('/', complaintController.create);
complaintRouter.patch('/:id/status', complaintController.updateStatus);

export default complaintRouter;
