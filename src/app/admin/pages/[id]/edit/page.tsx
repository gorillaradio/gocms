import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageEditForm } from "@/components/admin/page-edit-form";

interface PageEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PageEditPage({ params }: PageEditPageProps) {
  const { id } = await params;
  const page = await prisma.page.findUnique({
    where: { id },
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
          draggable: true,
          fields: true
        },
        orderBy: { order: "asc" }
      }
    }
  });
  
  // Convert SQLite 0/1 to boolean for draggable
  const fixedPage = page ? {
    ...page,
    blocks: page.blocks.map(block => ({
      ...block,
      draggable: !!block.draggable
    }))
  } : null;

  if (!fixedPage) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Edit Page: {fixedPage.title}
        </h1>
        <p className="text-muted-foreground">
          Modify the content of your page blocks
        </p>
      </div>

      <PageEditForm page={fixedPage} />
    </div>
  );
}