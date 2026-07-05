import { Router } from 'express';

import { vehicleTypeController } from '../controllers/vehicle-type.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const vehicleTypeRouter = Router();

vehicleTypeRouter.use(requireSession);

vehicleTypeRouter.get('/', vehicleTypeController.list);
vehicleTypeRouter.post('/', vehicleTypeController.create);
vehicleTypeRouter.patch('/:id', vehicleTypeController.update);

export default vehicleTypeRouter;
