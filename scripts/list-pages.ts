import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listPages() {
  const pages = await prisma.page.findMany({
    include: {
      blocks: {
        include: { fields: true }
      }
    }
  });
  
  console.log('📄 Pagine create:');
  pages.forEach(page => {
    console.log(`- /${page.slug} (${page.title}) - ${page.blocks.length} blocchi`);
  });
  
  await prisma.$disconnect();
}

listPages();