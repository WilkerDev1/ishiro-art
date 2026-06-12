import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { hashSync } from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing social links and placeholder artworks to avoid duplicates
  await prisma.socialLink.deleteMany({});
  await prisma.artwork.deleteMany({
    where: {
      OR: [
        { imageUrl: { startsWith: '/uploads/placeholder-' } },
        { imageUrl: { startsWith: '/uploads/commission-sample-' } },
      ],
    },
  });

  // Create admin user
  const hashedPassword = hashSync('admin123', 12);
  await prisma.admin.upsert({
    where: { username: 'ishiro' },
    update: {},
    create: {
      username: 'ishiro',
      password: hashedPassword,
    },
  });
  console.log('✅ Admin user created (username: ishiro, password: admin123)');

  // Create site config
  await prisma.siteConfig.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      artistName: 'ISHIRO',
      tagline: 'Cute & Funny Artist',
      email: 'ishiro.art@example.com',
      bio: '⭐ 19 | Cute & Funny Artist 😭\nCommissions Open (DMs)\nPixiv: pixiv.net/en/users/61774...',
    },
  });
  console.log('✅ Site config created');

  // Create social links
  const socialLinks = [
    { platform: 'twitter', url: 'https://x.com/ISHIRO_Art', label: 'X / Twitter', handle: '@ISHIRO_Art', icon: 'twitter', order: 1, visible: true },
    { platform: 'pixiv', url: 'https://pixiv.net/en/users/61774', label: 'Pixiv', handle: 'ISHIRO', icon: 'pixiv', order: 2, visible: true },
    { platform: 'instagram', url: 'https://instagram.com/ishiro_art', label: 'Instagram', handle: '@ishiro_art', icon: 'instagram', order: 3, visible: true },
    { platform: 'email', url: 'mailto:ishiro.art@example.com', label: 'Email', handle: 'ishiro.art@example.com', icon: 'email', order: 4, visible: true },
  ];

  for (const link of socialLinks) {
    await prisma.socialLink.create({ data: link });
  }
  console.log('✅ Social links created');

  // Create sample artworks
  const artworks = [
    { title: 'Sunset Crab', description: 'A cute crab enjoying the sunset at the beach', imageUrl: '/uploads/placeholder-1.png', category: 'Illustrations', tags: JSON.stringify(['Original', 'Beach', 'Cute']), featured: true, order: 1 },
    { title: 'Cyber Neon', description: 'Cyberpunk character design with neon accents', imageUrl: '/uploads/placeholder-2.png', category: 'Character Design', tags: JSON.stringify(['Cyberpunk', 'Original', 'Neon']), featured: true, order: 2 },
    { title: 'Forest Spirit', description: 'Mystical forest spirit illustration', imageUrl: '/uploads/placeholder-3.png', category: 'Illustrations', tags: JSON.stringify(['Fantasy', 'Original', 'Nature']), featured: true, order: 3 },
    { title: 'Mecha Girl', description: 'Mechanical warrior character concept', imageUrl: '/uploads/placeholder-4.png', category: 'Character Design', tags: JSON.stringify(['Mecha', 'Original', 'SciFi']), featured: false, order: 4 },
    { title: 'Summer Vibes', description: 'Quick sketch of summer mood', imageUrl: '/uploads/placeholder-5.png', category: 'Sketches', tags: JSON.stringify(['Sketch', 'Summer', 'Original']), featured: false, order: 5 },
    // Commission Samples (based on the user's files)
    { title: 'Tentacle Girl', description: 'Commission sample: Crimson dress with dark elements', imageUrl: '/uploads/commission-sample-1.png', category: 'Commissions', tags: JSON.stringify(['Commission', 'Anime', 'Crimson']), featured: false, order: 6 },
    { title: 'Zangshi Girl', description: 'Commission sample: Traditional Chinese-style character design', imageUrl: '/uploads/commission-sample-2.png', category: 'Commissions', tags: JSON.stringify(['Commission', 'Traditional', 'Zombie']), featured: false, order: 7 },
    { title: 'Thunder Deity', description: 'Commission sample: White haired deity illustration with drums', imageUrl: '/uploads/commission-sample-3.png', category: 'Commissions', tags: JSON.stringify(['Commission', 'Deity', 'WhiteHair']), featured: false, order: 8 },
    { title: 'Dragon Girl', description: 'Commission sample: Green haired character illustration with dragon elements', imageUrl: '/uploads/commission-sample-4.png', category: 'Commissions', tags: JSON.stringify(['Commission', 'Dragon', 'GreenHair']), featured: false, order: 9 },
    { title: 'Goldfish Kimono', description: 'Commission sample: Black haired girl with goldfish in kimono', imageUrl: '/uploads/commission-sample-5.png', category: 'Commissions', tags: JSON.stringify(['Commission', 'Goldfish', 'Kimono']), featured: false, order: 10 },
  ];

  for (const artwork of artworks) {
    await prisma.artwork.create({ data: artwork });
  }
  console.log('✅ Sample artworks created');

  console.log('🎉 Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
