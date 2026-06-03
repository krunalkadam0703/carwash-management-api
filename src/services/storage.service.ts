import fs from 'fs';

import path from 'path';

import multer from 'multer';

import { StorageType } from '../@types/upload.types.js';

export class StorageService {
  static createStorage(
    storageType: StorageType = 'memory',

    destination = 'uploads',
  ): multer.StorageEngine {
    switch (storageType) {
      case 'disk':
        return this.createDiskStorage(destination);

      case 'memory':
        return multer.memoryStorage();

      default:
        return multer.memoryStorage();
    }
  }

  private static createDiskStorage(destination: string): multer.StorageEngine {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, {
        recursive: true,
      });
    }

    return multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, destination);
      },

      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

        const extension = path.extname(file.originalname);

        const fileName = `${uniqueSuffix}${extension}`;

        cb(null, fileName);
      },
    });
  }
}
