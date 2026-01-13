import Link from "next/link"
import { ChevronRight, FileDigit as FileList, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { TableOfContents } from "@/components/markdown/table-of-contents"
import { getNodeByPath, buildTree, categoryInfo, type TreeNode } from "@/lib/mock-data"

interface NotesPageProps {
  params: Promise<{
    path?: string[]
  }>
}

export default async function NotesPage({ params }: NotesPageProps) {
  const { path = [] } = await params

  // ルートの場合は概要を表示
  if (path.length === 0) {
    return <NotesOverview />
  }

  const node = getNodeByPath(path)

  // ノードが見つからない場合
  if (!node) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">ページが見つかりません</h1>
          <p className="mt-2 text-muted-foreground">指定されたパスは存在しません</p>
          <Button asChild className="mt-4">
            <Link href="/notes">Notesトップへ</Link>
          </Button>
        </div>
      </div>
    )
  }

  // フォルダの場合は子ノードの一覧を表示
  if (node.type === "folder") {
    return <FolderView node={node} path={path} />
  }

  // 記事の場合は本文を表示
  return <ArticleView node={node} path={path} />
}

function NotesOverview() {
  const rootFolders = buildTree(null)

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 lg:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Notes</h1>
        <p className="mt-2 text-muted-foreground">
          ツリー構造でコンテンツを探索できます。左のナビゲーションからカテゴリを選択してください。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {rootFolders.map((folder) => {
          const info = categoryInfo[folder.name as keyof typeof categoryInfo]
          const children = buildTree(folder.id)
          const postCount = children.filter((c) => c.type === "post").length

          return (
            <Link key={folder.id} href={`/notes/${folder.name}`}>
              <div className="rounded-lg border border-border p-4 transition-colors hover:bg-accent/50">
                <h3 className="font-semibold">{info?.name || folder.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{info?.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{postCount} 件のコンテンツ</p>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}

function FolderView({ node, path }: { node: TreeNode; path: string[] }) {
  const children = buildTree(node.id)
  const overview = children.find((c) => c.type === "post" && c.name === "overview")
  const otherChildren = children.filter((c) => c.name !== "overview")

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 lg:py-12">
      {/* Breadcrumb */}
      <Breadcrumb path={path} />

      {/* Folder Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold capitalize">{node.name}</h1>
      </header>

      {/* Overview Content */}
      {overview && (
        <div className="mb-8 rounded-lg border border-border p-6">
          <MarkdownRenderer content={overview.content_md || ""} />
        </div>
      )}

      {/* Children List */}
      <div className="space-y-2">
        <h2 className="mb-4 text-lg font-semibold">コンテンツ</h2>
        {otherChildren.map((child) => (
          <Link
            key={child.id}
            href={`/notes/${[...path, child.name].join("/")}`}
            className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-3">
              <FileList className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{child.title || child.name}</p>
                {child.excerpt && <p className="text-sm text-muted-foreground line-clamp-1">{child.excerpt}</p>}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </main>
  )
}

function ArticleView({ node, path }: { node: TreeNode; path: string[] }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
      {/* Breadcrumb */}
      <Breadcrumb path={path} />

      <div className="flex gap-8">
        {/* Article Content */}
        <article className="min-w-0 flex-1">
          <header className="mb-8 border-b border-border pb-6">
            <h1 className="text-3xl font-bold leading-tight text-balance">{node.title}</h1>
            {node.excerpt && <p className="mt-2 text-muted-foreground">{node.excerpt}</p>}
            {node.tags && (
              <div className="mt-4 flex flex-wrap gap-2">
                {node.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Articles Link */}
            {node.slug && (
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/articles/${node.slug}`} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Articles形式で見る
                  </Link>
                </Button>
              </div>
            )}
          </header>

          <div className="prose-custom">
            <MarkdownRenderer content={node.content_md || ""} />
          </div>
        </article>

        {/* TOC Sidebar */}
        <aside className="hidden w-64 shrink-0 xl:block">
          <div className="sticky top-8">
            <TableOfContents content={node.content_md || ""} />
          </div>
        </aside>
      </div>
    </main>
  )
}

function Breadcrumb({ path }: { path: string[] }) {
  return (
    <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/notes" className="transition-colors hover:text-foreground">
        Notes
      </Link>
      {path.map((segment, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4" />
          {index < path.length - 1 ? (
            <Link
              href={`/notes/${path.slice(0, index + 1).join("/")}`}
              className="transition-colors hover:text-foreground"
            >
              {segment}
            </Link>
          ) : (
            <span className="text-foreground">{segment}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
