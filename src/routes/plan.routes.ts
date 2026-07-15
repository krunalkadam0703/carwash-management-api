import { Router } from 'express';

import { planController } from '../controllers/plan.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const planRouter = Router();

planRouter.use(requireSession);

planRouter.get('/', planController.list);
planRouter.get('/:id', planController.getById);
planRouter.post('/', planController.create);
planRouter.patch('/:id', planController.update);

export default planRouter;
