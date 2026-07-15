import { Router } from 'express';

import { customerController } from '../controllers/customer.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const customerRouter = Router();

customerRouter.use(requireSession);

customerRouter.get('/', customerController.list);
customerRouter.patch('/:id', customerController.update);

export default customerRouter;
