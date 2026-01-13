import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { TableOfContents } from "@/components/markdown/table-of-contents"
import { getAllPosts, getBreadcrumbs } from "@/lib/mock-data"

interface ArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = use(params)
  const article = getAllPosts().find((post) => post.slug === slug)

  if (!article) {
    notFound()
  }

  const breadcrumbs = getBreadcrumbs(article.id)
  const notesPath = breadcrumbs.map((b) => b.name).join("/")

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Back Link */}
      <Link
        href="/articles"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        記事一覧に戻る
      </Link>

      <div className="flex gap-8">
        {/* Main Content */}
        <article className="min-w-0 flex-1">
          {/* Article Header */}
          <header className="mb-8 border-b border-border pb-6">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <time dateTime={article.date}>{article.date}</time>
              {article.category && (
                <Badge variant="outline" className="ml-2">
                  {article.category}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold leading-tight text-balance md:text-4xl">{article.title}</h1>
            {article.excerpt && <p className="mt-3 text-lg text-muted-foreground">{article.excerpt}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Notes Link */}
            <div className="mt-6">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/notes/${notesPath}`} className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Notes形式で開く
                </Link>
              </Button>
            </div>
          </header>

          {/* Article Body */}
          <div className="prose-custom max-w-none">
            <MarkdownRenderer content={article.content_md || ""} />
          </div>
        </article>

        {/* Sidebar - TOC */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20">
            <TableOfContents content={article.content_md || ""} />
          </div>
        </aside>
      </div>
    </main>
  )
}
