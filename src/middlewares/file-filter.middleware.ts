import { Request } from 'express';

import { MimeType } from '../constants/mime-types.js';

export class FileFilterMiddleware {
  static create(
    allowedMimeTypes: MimeType[] = [],
  ) {
    return (
      _req: Request,

      file: Express.Multer.File,

      cb: any,
    ) => {
      // Allow all if nothing specified
      if (allowedMimeTypes.length === 0) {
        return cb(null, true);
      }

      const isAllowed =
        allowedMimeTypes.includes(
          file.mimetype as MimeType,
        );

      if (isAllowed) {
        return cb(null, true);
      }

      return cb(
        new Error(
          `Invalid file type: ${file.mimetype}`,
        ),

        false,
      );
    };
  }
}