import { PrismaClient } from '@/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  let dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

  if (dbUrl.startsWith('file:')) {
    const filePath = dbUrl.replace(/^file:/, '');
    if (!path.isAbsolute(filePath)) {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      // src/lib is 2 levels deep from the project root
      const absolutePath = path.resolve(currentDir, '../../', filePath);
      dbUrl = `file:${absolutePath}`;
    }
  }

  console.log('[PrismaClient] Connecting to database URL:', dbUrl);

  const adapter = new PrismaBetterSqlite3({
    url: dbUrl,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
