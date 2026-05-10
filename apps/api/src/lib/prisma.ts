import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient to avoid connection pool exhaustion during hot-reload.
// In development, Next.js/ts-node-dev clears the module cache on every restart,
// which would create a new PrismaClient instance each time. We store it on
// `globalThis` to persist it across reloads.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
