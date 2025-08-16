import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDb() {
  const pages = await prisma.page.findMany();
  
  pages.forEach(page => {
    console.log(`Page: ${page.slug}`);
    console.log(`Title: ${page.title}`);
    console.log(`HTML Template: ${page.htmlTemplate ? 'YES (' + page.htmlTemplate.length + ' chars)' : 'NO'}`);
    console.log('---');
  });
  
  await prisma.$disconnect();
}

debugDb();