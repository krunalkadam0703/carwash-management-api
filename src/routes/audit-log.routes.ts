import { Router } from 'express';

import { auditLogController } from '../controllers/audit-log.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const auditLogRouter = Router();

auditLogRouter.use(requireSession);

auditLogRouter.get('/', auditLogController.list);

export default auditLogRouter;
