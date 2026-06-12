import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminDashboard from '@/components/AdminDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | ISHIRO_Art',
  description: 'Manage gallery, uploads, social links, and website settings.',
};

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  // Fetch initial data on the server for instant loading
  const [artworks, socialLinks, siteConfig] = await Promise.all([
    prisma.artwork.findMany({ orderBy: { order: 'asc' } }),
    prisma.socialLink.findMany({ orderBy: { order: 'asc' } }),
    prisma.siteConfig.findUnique({ where: { id: 'main' } }),
  ]);

  return (
    <AdminDashboard
      initialArtworks={artworks}
      initialSocialLinks={socialLinks}
      initialSiteConfig={siteConfig || {
        id: 'main',
        artistName: 'ISHIRO',
        tagline: 'Cute & Funny Artist',
        email: 'ishiro@example.com',
        bio: '19 | Cute & Funny Artist | Commissions Open (DMs)',
        heroImageUrl: null,
        avatarUrl: null,
      }}
    />
  );
}
