import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllPages, getSetting } from "@/lib/db"
import { FileText, Settings, Globe } from "lucide-react"

export default async function AdminDashboard() {
  const [pages, siteTitle] = await Promise.all([
    getAllPages(),
    getSetting('site_title')
  ])

  const publishedPages = pages.filter(page => page.published)
  const draftPages = pages.filter(page => !page.published)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to {siteTitle || 'GoCMS'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pages
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pages.length}</div>
            <p className="text-xs text-muted-foreground">
              All pages in your site
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Published Pages
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedPages.length}</div>
            <p className="text-xs text-muted-foreground">
              Live on your website
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Draft Pages
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftPages.length}</div>
            <p className="text-xs text-muted-foreground">
              Work in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pages.slice(0, 5).map((page) => (
              <div key={page.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{page.title}</p>
                  <p className="text-sm text-muted-foreground">
                    /{page.slug} • {page.blocks.length} blocks
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    page.published 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {page.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}