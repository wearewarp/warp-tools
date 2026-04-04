import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const THUMBNAILS_DIR = path.join(process.cwd(), 'uploads', 'thumbnails');

const IMAGE_MIMETYPES = new Set([
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/tiff',
  'image/webp',
]);

export async function generateThumbnail(
  filePath: string,
  mimeType: string
): Promise<string | null> {
  // PDFs: skip for now
  if (mimeType === 'application/pdf') {
    return null;
  }

  // Only handle images
  if (!IMAGE_MIMETYPES.has(mimeType)) {
    return null;
  }

  try {
    // Dynamic import to avoid issues during build
    const sharp = (await import('sharp')).default;

    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

    const uuid = randomUUID();
    const thumbnailFilename = `${uuid}.jpg`;
    const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);
    const absoluteFilePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    await sharp(absoluteFilePath)
      .resize(200, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return path.relative(process.cwd(), thumbnailPath);
  } catch (err) {
    console.error('Failed to generate thumbnail:', err);
    return null;
  }
}
