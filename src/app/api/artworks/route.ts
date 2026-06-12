import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const artworks = await prisma.artwork.findMany({
      where: category && category !== 'All' ? { category } : undefined,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(artworks);
  } catch (error) {
    console.error('Failed to fetch artworks:', error);
    return NextResponse.json({ error: 'Failed to fetch artworks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, imageUrl, category, tags, featured } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Title and image URL are required' }, { status: 400 });
    }

    const artwork = await prisma.artwork.create({
      data: {
        title,
        description: description || null,
        imageUrl,
        category: category || 'Illustrations',
        tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
        featured: featured || false,
      },
    });

    return NextResponse.json(artwork, { status: 201 });
  } catch (error) {
    console.error('Failed to create artwork:', error);
    return NextResponse.json({ error: 'Failed to create artwork' }, { status: 500 });
  }
}
