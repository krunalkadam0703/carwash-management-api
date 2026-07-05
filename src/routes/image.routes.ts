import { Router } from 'express';

import { MimeType } from '../constants/mime-types.js';
import { imageController } from '../controllers/image.controller.js';
import { requireSession } from '../middlewares/session.middleware.js';
import { UploadMiddleware } from '../middlewares/upload.middleware.js';

const imageRouter = Router();
const imageUpload = UploadMiddleware.single('image', {
  storageType: 'memory',
  allowedMimeTypes: [MimeType.JPEG, MimeType.JPG, MimeType.PNG, MimeType.WEBP],
  maxFileSizeMB: 5,
});

imageRouter.use(requireSession);

imageRouter.post('/vehicles/:vehicleId', imageUpload, imageController.uploadVehicleImage);
imageRouter.post('/services/:serviceId', imageUpload, imageController.uploadServiceImage);

export default imageRouter;
