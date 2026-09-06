import dotenv from 'dotenv';
import pkg from '@prisma/client';

dotenv.config();

const { PrismaClient } = pkg;
const globalForPrisma = global;

console.log('[Prisma] Initializing Prisma client...');

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Prisma] Graceful shutdown triggered. Disconnecting...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Prisma] SIGINT received. Disconnecting...');
  await prisma.$disconnect();
  process.exit(0);
});

console.log('[Prisma] Client ready for database access.');

export default prisma;
