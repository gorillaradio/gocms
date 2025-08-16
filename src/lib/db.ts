import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database utility functions
export async function getPageBySlug(slug: string) {
  return prisma.page.findUnique({
    where: { slug },
    include: {
      blocks: {
        orderBy: { order: 'asc' }
      }
    }
  })
}

export async function getAllPages() {
  return prisma.page.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      blocks: true
    }
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email }
  })
}

export async function getSetting(key: string) {
  const setting = await prisma.settings.findUnique({
    where: { key }
  })
  return setting?.value
}

export async function setSetting(key: string, value: string) {
  return prisma.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  })
}