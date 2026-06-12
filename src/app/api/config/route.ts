import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    let config = await prisma.siteConfig.findUnique({
      where: { id: 'main' },
    });

    if (!config) {
      config = await prisma.siteConfig.create({
        data: { id: 'main' },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to fetch config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { artistName, tagline, email, bio, heroImageUrl, avatarUrl } = body;

    const config = await prisma.siteConfig.upsert({
      where: { id: 'main' },
      update: {
        ...(artistName !== undefined && { artistName }),
        ...(tagline !== undefined && { tagline }),
        ...(email !== undefined && { email }),
        ...(bio !== undefined && { bio }),
        ...(heroImageUrl !== undefined && { heroImageUrl }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      create: {
        id: 'main',
        artistName: artistName || 'ISHIRO',
        tagline: tagline || 'Cute & Funny Artist',
        email: email || null,
        bio: bio || null,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to update config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
