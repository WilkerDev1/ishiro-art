import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
    const {
      artistName,
      tagline,
      email,
      bio,
      aboutText,
      stat1Value,
      stat1Label,
      stat2Value,
      stat2Label,
      stat3Value,
      stat3Label,
      heroImageUrl,
      avatarUrl,
    } = body;

    const config = await prisma.siteConfig.upsert({
      where: { id: 'main' },
      update: {
        ...(artistName !== undefined && { artistName }),
        ...(tagline !== undefined && { tagline }),
        ...(email !== undefined && { email }),
        ...(bio !== undefined && { bio }),
        ...(aboutText !== undefined && { aboutText }),
        ...(stat1Value !== undefined && { stat1Value }),
        ...(stat1Label !== undefined && { stat1Label }),
        ...(stat2Value !== undefined && { stat2Value }),
        ...(stat2Label !== undefined && { stat2Label }),
        ...(stat3Value !== undefined && { stat3Value }),
        ...(stat3Label !== undefined && { stat3Label }),
        ...(heroImageUrl !== undefined && { heroImageUrl }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      create: {
        id: 'main',
        artistName: artistName || 'ISHIRO',
        tagline: tagline || 'Cute & Funny Artist',
        email: email || null,
        bio: bio || null,
        aboutText: aboutText || null,
        stat1Value: stat1Value || '1.2K+',
        stat1Label: stat1Label || 'Followers',
        stat2Value: stat2Value || '',
        stat2Label: stat2Label || 'Artworks',
        stat3Value: stat3Value || '∞',
        stat3Label: stat3Label || 'Passion',
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to update config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
