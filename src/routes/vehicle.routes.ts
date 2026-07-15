import { Router } from 'express';

import { vehicleController } from '../controllers/vehicle.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const vehicleRouter = Router();

vehicleRouter.use(requireSession);

vehicleRouter.get('/', vehicleController.list);
vehicleRouter.get('/:id', vehicleController.getById);
vehicleRouter.post('/', vehicleController.create);
vehicleRouter.patch('/:id', vehicleController.update);

export default vehicleRouter;
