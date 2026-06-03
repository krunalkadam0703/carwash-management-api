import { UploadOptions } from '../@types/upload.types.js';

import { MulterService } from '../services/multer.service.js';

export class UploadMiddleware {
  static single(
    fieldName: string,

    options: UploadOptions = {},
  ) {
    return MulterService.create(options).single(fieldName);
  }

  static array(
    fieldName: string,

    maxCount: number,

    options: UploadOptions = {},
  ) {
    return MulterService.create(options).array(fieldName, maxCount);
  }

  static fields(
    fields: {
      name: string;

      maxCount?: number;
    }[],

    options: UploadOptions = {},
  ) {
    return MulterService.create(options).fields(fields);
  }
}
