import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllPages } from "@/lib/db"
import Link from "next/link"
import { Plus, Edit, Eye, Globe, FileText } from "lucide-react"

export default async function PagesPage() {
  const pages = await getAllPages()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pages
          </h1>
          <p className="text-muted-foreground">
            Manage all your website pages
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/pages/new">
            <Plus className="h-4 w-4 mr-2" />
            New Page
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            All Pages ({pages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pages.map((page) => (
              <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{page.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    /{page.slug} • {page.blocks.length} blocks • 
                    Updated {page.updatedAt.toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    page.published 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {page.published ? (
                      <>
                        <Globe className="h-3 w-3 mr-1" />
                        Published
                      </>
                    ) : (
                      'Draft'
                    )}
                  </span>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/pages/${page.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  
                  {page.published && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${page.slug}`} target="_blank">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {pages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No pages yet. Create your first page to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}