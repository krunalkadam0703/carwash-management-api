import { MimeType } from '../constants/mime-types.js';

export type StorageType = 'disk' | 'memory' | 's3';

export interface UploadOptions {
  storageType?: StorageType;

  destination?: string;

  allowedMimeTypes?: MimeType[];

  maxFileSizeMB?: number;
}
