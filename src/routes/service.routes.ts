import { Router } from 'express';

import { serviceController } from '../controllers/service.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const serviceRouter = Router();

serviceRouter.use(requireSession);

serviceRouter.get('/', serviceController.list);
serviceRouter.get('/:id', serviceController.getById);
serviceRouter.post('/', serviceController.create);
serviceRouter.patch('/:id', serviceController.update);
serviceRouter.delete('/:id', serviceController.delete);

export default serviceRouter;
