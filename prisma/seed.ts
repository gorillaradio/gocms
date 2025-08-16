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

  console.log("Database seeded with admin user and basic settings");

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
