import { prisma } from "@/lib/db";
import { PageRenderer } from "@/components/page-renderer";

export default async function Home() {
  const homePage = await prisma.page.findUnique({
    where: { slug: "home" },
    include: {
      blocks: {
        include: { fields: true },
        orderBy: { order: "asc" }
      }
    }
  });

  if (!homePage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Homepage non trovata
          </h1>
          <p className="text-muted-foreground">
            Importa prima i file HTML con lo script di import.
          </p>
        </div>
      </div>
    );
  }

  return <PageRenderer page={homePage} />;
}
