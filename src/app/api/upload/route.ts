import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/** Maximum longest dimension for the generated thumbnail */
const THUMB_MAX_PX = 1280;
/** WebP compression quality for thumbnails (0–100) */
const THUMB_QUALITY = 82;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    // type: 'artwork' | 'hero' | 'avatar' — controls whether a thumbnail is generated
    const uploadType = (formData.get('type') as string | null) ?? 'artwork';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, AVIF' },
        { status: 400 }
      );
    }

    // Generate unique base filename (always store original as-is)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomStr}.${ext}`;

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Save original file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const originalUrl = `/uploads/${filename}`;

    // Only generate thumbnail for artwork uploads (not hero/avatar)
    if (uploadType === 'artwork') {
      try {
        const thumbFilename = `thumb-${timestamp}-${randomStr}.webp`;
        const thumbFilepath = path.join(uploadsDir, thumbFilename);

        await sharp(buffer)
          .resize(THUMB_MAX_PX, THUMB_MAX_PX, {
            fit: 'inside',       // Preserve aspect ratio; never upscale
            withoutEnlargement: true,
          })
          .webp({ quality: THUMB_QUALITY })
          .toFile(thumbFilepath);

        const thumbnailUrl = `/uploads/${thumbFilename}`;
        return NextResponse.json({ url: originalUrl, thumbnailUrl }, { status: 201 });
      } catch (thumbError) {
        // If thumbnail generation fails for any reason, still return the original
        console.error('Thumbnail generation failed, falling back to original:', thumbError);
        return NextResponse.json({ url: originalUrl }, { status: 201 });
      }
    }

    // Hero / avatar: return original only
    return NextResponse.json({ url: originalUrl }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
