import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    console.log('[API PUT] id:', id, 'body:', body);
    
    // Check if record exists
    const existing = await prisma.artwork.findUnique({ where: { id } });
    if (!existing) {
      console.error('[API PUT] Artwork not found for ID:', id);
      const all = await prisma.artwork.findMany({ select: { id: true, title: true } });
      console.log('[API PUT] Available IDs in database:', all);
      return NextResponse.json({ error: `Artwork not found for ID: ${id}` }, { status: 404 });
    }

    const { title, description, imageUrl, category, tags, featured, order } = body;

    const artwork = await prisma.artwork.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags: typeof tags === 'string' ? tags : JSON.stringify(tags) }),
        ...(featured !== undefined && { featured }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json(artwork);
  } catch (error) {
    console.error('Failed to update artwork:', error);
    return NextResponse.json({ error: 'Failed to update artwork' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('[API DELETE] id:', id);

    // Check if record exists
    const existing = await prisma.artwork.findUnique({ where: { id } });
    if (!existing) {
      console.error('[API DELETE] Artwork not found for ID:', id);
      const all = await prisma.artwork.findMany({ select: { id: true, title: true } });
      console.log('[API DELETE] Available IDs in database:', all);
      return NextResponse.json({ error: `Artwork not found for ID: ${id}` }, { status: 404 });
    }

    await prisma.artwork.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete artwork:', error);
    return NextResponse.json({ error: 'Failed to delete artwork' }, { status: 500 });
  }
}
