import { prisma } from "@/lib/db";
import { BlockData } from "../types/blocks";

export async function getPageBySlug(slug: string) {
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      blocks: {
        orderBy: { order: "asc" }
      }
    }
  });

  if (!page) {
    return null;
  }

  return {
    ...page,
    blocks: page.blocks.map(block => ({
      id: block.id,
      type: block.type,
      variant: block.variant,
      props: block.props as any,
      order: block.order
    })) as BlockData[]
  };
}

export async function getHomePage() {
  return getPageBySlug("home");
}