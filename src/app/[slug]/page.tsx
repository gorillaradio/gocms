import { prisma } from "@/lib/db";
import { PageRenderer } from "@/components/page-renderer";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  
  const page = await prisma.page.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      headContent: true,
      published: true,
      blocks: {
        select: {
          id: true,
          type: true,
          htmlContent: true,
          order: true,
          fields: true
        },
        orderBy: { order: "asc" }
      }
    }
  });

  if (!page) {
    notFound();
  }

  return <PageRenderer page={page} />;
}