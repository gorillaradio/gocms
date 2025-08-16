import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash("GoGoGo14", 12);

  const admin = await prisma.user.upsert({
    where: { email: "sebastiano@gorillaradio.it" },
    update: {
      password: hashedPassword,
      name: "Admin User",
    },
    create: {
      email: "sebastiano@gorillaradio.it",
      password: hashedPassword,
      name: "Admin User",
    },
  });

  console.log("Created admin user:", admin);

  // Create home page with example blocks
  const homePage = await prisma.page.upsert({
    where: { slug: "home" },
    update: {},
    create: {
      slug: "home",
      title: "Welcome to GoCMS",
      published: true,
      blocks: {
        create: [
          {
            type: "hero",
            variant: "full",
            order: 1,
            props: {
              title: "Welcome to Your New Website",
              subtitle: "This is a demo homepage created with GoCMS",
              variant: "full",
            },
          },
          {
            type: "cards",
            variant: "grid-3",
            order: 2,
            props: {
              title: "Our Services",
              cards: [
                {
                  title: "Service 1",
                  description: "Description for service 1",
                },
                {
                  title: "Service 2",
                  description: "Description for service 2",
                },
                {
                  title: "Service 3",
                  description: "Description for service 3",
                },
              ],
              variant: "grid-3",
            },
          },
        ],
      },
    },
  });

  console.log("Created home page:", homePage);

  // Create basic site settings
  await prisma.settings.upsert({
    where: { key: "site_title" },
    update: {},
    create: {
      key: "site_title",
      value: "GoCMS Demo Site",
    },
  });

  await prisma.settings.upsert({
    where: { key: "site_description" },
    update: {},
    create: {
      key: "site_description",
      value: "A simple CMS built with Next.js",
    },
  });

  console.log("Created site settings");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
