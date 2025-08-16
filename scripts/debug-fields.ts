import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugFields() {
  const page = await prisma.page.findUnique({
    where: { slug: 'home' },
    include: {
      blocks: {
        include: { fields: true },
        orderBy: { order: 'asc' }
      }
    }
  });
  
  if (!page) {
    console.log('Page not found');
    return;
  }
  
  console.log(`Page: ${page.title}`);
  page.blocks.forEach(block => {
    console.log(`\nBlock: ${block.type}`);
    block.fields.forEach(field => {
      console.log(`  ${field.fieldName} (${field.displayName}): "${field.value}"`);
    });
  });
  
  await prisma.$disconnect();
}

debugFields();