import { Router } from 'express';

import { notificationController } from '../controllers/notification.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';

const notificationRouter = Router();

notificationRouter.use(requireSession);

notificationRouter.get('/', notificationController.list);
notificationRouter.get('/unread-count', notificationController.unreadCount);
notificationRouter.post('/mark-all-read', notificationController.markAllRead);
notificationRouter.patch('/:id/read', notificationController.markRead);
notificationRouter.patch('/:id/archive', notificationController.archive);

export default notificationRouter;
