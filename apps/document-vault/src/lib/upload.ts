import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/tiff',
  'image/webp',
]);

export interface UploadResult {
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
}

export class UploadError extends Error {
  constructor(
    message: string,
    public code: 'FILE_TOO_LARGE' | 'INVALID_MIMETYPE' | 'SAVE_FAILED'
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

export async function saveFile(file: File): Promise<UploadResult> {
  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError(
      `File too large. Max size is 25MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB`,
      'FILE_TOO_LARGE'
    );
  }

  // Validate mimetype
  if (!ALLOWED_MIMETYPES.has(file.type)) {
    throw new UploadError(
      `File type not allowed: ${file.type}. Allowed: PDF, PNG, JPG, JPEG, TIFF, WEBP`,
      'INVALID_MIMETYPE'
    );
  }

  // Build save path: uploads/{year}/{month}/{uuid}-{original-name}
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const uuid = randomUUID();

  // Sanitize original filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${uuid}-${sanitizedName}`;

  const dirPath = path.join(UPLOADS_DIR, year, month);
  const filePath = path.join(dirPath, filename);

  // Create directory if needed
  fs.mkdirSync(dirPath, { recursive: true });

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return {
    filename,
    originalName: file.name,
    mimeType: file.type,
    fileSize: file.size,
    filePath: path.relative(process.cwd(), filePath),
  };
}
