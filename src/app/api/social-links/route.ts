import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const links = await prisma.socialLink.findMany({
      where: { visible: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error('Failed to fetch social links:', error);
    return NextResponse.json({ error: 'Failed to fetch social links' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, url, label, handle, icon, visible } = body;

    if (!platform || !url) {
      return NextResponse.json({ error: 'Platform and URL are required' }, { status: 400 });
    }

    const link = await prisma.socialLink.create({
      data: {
        platform,
        url,
        label: label || null,
        handle: handle || null,
        icon: icon || platform.toLowerCase(),
        visible: visible !== undefined ? visible : true,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('Failed to create social link:', error);
    return NextResponse.json({ error: 'Failed to create social link' }, { status: 500 });
  }
}
