import prisma from '@/lib/prisma';
import GalleryClient from '@/components/GalleryClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery | ISHIRO_Art',
  description: 'Explore the artwork library of ISHIRO_Art. Cute & Funny illustrations, character designs, commissions, and sketches.',
};

async function getArtworks() {
  try {
    return await prisma.artwork.findMany({
      orderBy: { order: 'asc' },
    });
  } catch (error) {
    console.error('Failed to fetch artworks:', error);
    return [];
  }
}

export default async function GalleryPage() {
  const artworks = await getArtworks();
  return <GalleryClient artworks={artworks} />;
}
