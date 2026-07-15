import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export type UploadFolder = 'vehicles' | 'daily-cleanings' | 'profiles' | 'services';

export interface StoredFile {
  fileName: string;
  relativePath: string;
  publicUrl: string;
}

const PUBLIC_ROOT = 'public';
const UPLOAD_ROOT = 'uploads';

export class LocalFileStorageService {
  async saveBuffer(
    folder: UploadFolder,
    buffer: Buffer,
    originalName: string,
  ): Promise<StoredFile> {
    const extension = path.extname(originalName);
    const safeName = `${Date.now()}-${randomUUID()}${extension}`;
    const relativePath = path.join(UPLOAD_ROOT, folder, safeName);
    const absolutePath = path.join(PUBLIC_ROOT, relativePath);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);

    return {
      fileName: safeName,
      relativePath,
      publicUrl: `/public/${relativePath.split(path.sep).join('/')}`,
    };
  }
}

export const localFileStorageService = new LocalFileStorageService();
