import multer from 'multer';

import { UploadOptions } from '../@types/upload.types.js';

import { StorageService } from './storage.service.js';

import { FileFilterMiddleware } from '../middlewares/file-filter.middleware.js';

export class MulterService {
  static create(options: UploadOptions = {}) {
    const {
      storageType = 'memory',

      destination = 'uploads',

      allowedMimeTypes = [],

      maxFileSizeMB = 5,
    } = options;

    return multer({
      storage: StorageService.createStorage(
        storageType,
        destination,
      ),

      fileFilter:
        FileFilterMiddleware.create(
          allowedMimeTypes,
        ),

      limits: {
        fileSize:
          maxFileSizeMB * 1024 * 1024,
      },
    });
  }
}