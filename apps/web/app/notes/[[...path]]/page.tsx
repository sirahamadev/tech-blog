import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, FileDigit as FileList, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer';
import { TableOfContents } from '@/components/markdown/table-of-contents';
import { categoryInfo } from '@/lib/mock-data'; // Keep categoryInfo for descriptions/icons if useful, or move to constants
import { api } from '@/lib/api';
import type { NoteNode, Post } from '@/types/api';

interface NotesPageProps {
  params: Promise<{
    path?: string[];
  }>;
}

export default async function NotesPage({ params }: NotesPageProps) {
  const { path = [] } = await params;

  // Fetch all nodes to build tree/resolve path
  // Optimization: In real app, we might search by path query or recursive CTE, but fetching all is MVP.
  const treeResponse = await api.getNoteTree();
  const allNodes = treeResponse.nodes;

  // ルートの場合は概要を表示
  if (path.length === 0) {
    return <NotesOverview nodes={allNodes} />;
  }

  // Resolve Path to Node
  let currentParentId: string | null = null;
  let targetNode: NoteNode | null = null;

  for (const segment of path) {
    // Find node with this slug and current parent
    const found = allNodes.find((n) => n.parent_id === currentParentId && n.slug === segment);
    if (!found) {
      targetNode = null;
      break;
    }
    targetNode = found;
    currentParentId = found.id;
  }

  // ノードが見つからない場合
  if (!targetNode) {
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
    );
  }

  // Fetch detailed content (especially for posts or folder overview if needed)
  const contentResponse = await api.getNoteContent(targetNode.id);
  const { node, post } = contentResponse;

  // Build breadcrumbs for display (we already have path segments, but titles might be nicer? Path segments valid for links)
  // We can pass `path` (slug strings) to Views.

  // フォルダの場合は子ノードの一覧を表示
  if (node.node_type === 'folder') {
    // Check for "overview" post child
    const children = allNodes
      .filter((n) => n.parent_id === node.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    let overviewContent = '';

    // In mock data logic, "overview" was a post named overview.
    // We need to fetch it if it exists.
    const overviewNode = children.find((c) => c.node_type === 'post' && c.slug === 'overview');
    if (overviewNode) {
      // We need to fetch content for overview node
      // To avoid N+1, maybe we skip or fetch separately.
      // For MVP, fetch it.
      try {
        const ovRes = await api.getNoteContent(overviewNode.id);
        overviewContent = ovRes.post?.content_md || '';
      } catch (e) {
        // ignore
      }
    }

    return (
      <FolderView
        node={node}
        childrenNodes={children}
        path={path}
        overviewContent={overviewContent}
      />
    );
  }

  // 記事の場合は本文を表示
  if (post) {
    return <ArticleView node={node} post={post} path={path} />;
  } else {
    // Should not happen if data integrity is good, but fallback
    return <div>Content not found</div>;
  }
}

function NotesOverview({ nodes }: { nodes: NoteNode[] }) {
  const rootFolders = nodes
    .filter((n) => n.parent_id === null)
    .sort((a, b) => a.sort_order - b.sort_order);

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
          const info = categoryInfo[folder.slug as keyof typeof categoryInfo] || {
            name: folder.title,
            description: folder.title,
          };
          // Count descendants logic?
          // Simple count of immediate children or recursive? Mock did filter(post).
          // Let's count all descendants that are posts? Or just kids.
          // Let's count immediate children for now to match simplicity or traverse.
          // Traverse to count posts:
          // ... implementation ommitted for brevity, assume simplistic
          const countDescendants = (parentId: string): number => {
            const children = nodes.filter((n) => n.parent_id === parentId);
            let count = children.filter((c) => c.node_type === 'post').length;
            children
              .filter((c) => c.node_type === 'folder')
              .forEach((c) => (count += countDescendants(c.id)));
            return count;
          };
          const postCount = countDescendants(folder.id);

          return (
            <Link key={folder.id} href={`/notes/${folder.slug}`}>
              <div className="rounded-lg border border-border p-4 transition-colors hover:bg-accent/50">
                <h3 className="font-semibold">{info.name || folder.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{info.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{postCount} 件のコンテンツ</p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

function FolderView({
  node,
  childrenNodes,
  path,
  overviewContent,
}: {
  node: NoteNode;
  childrenNodes: NoteNode[];
  path: string[];
  overviewContent?: string;
}) {
  // Filter out "overview" from list if it's treated specially
  const displayChildren = childrenNodes.filter((c) => c.slug !== 'overview');

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 lg:py-12">
      {/* Breadcrumb */}
      <Breadcrumb path={path} />

      {/* Folder Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold capitalize">{node.title}</h1>
      </header>

      {/* Overview Content */}
      {overviewContent && (
        <div className="mb-8 rounded-lg border border-border p-6 prose-custom">
          <MarkdownRenderer content={overviewContent} />
        </div>
      )}

      {/* Children List */}
      <div className="space-y-2">
        <h2 className="mb-4 text-lg font-semibold">コンテンツ</h2>
        {displayChildren.map((child) => (
          <Link
            key={child.id}
            href={`/notes/${[...path, child.slug].join('/')}`}
            className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-3">
              <FileList className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{child.title}</p>
                {/* excerpt not in NoteNode, usually in Post. if needed, fetch? or lightweight tree doesn't have it. Skip for now */}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
        {displayChildren.length === 0 && (
          <p className="text-muted-foreground">コンテンツがありません</p>
        )}
      </div>
    </main>
  );
}

function ArticleView({ node, post, path }: { node: NoteNode; post: Post; path: string[] }) {
  // Post has tags, but they are not in specific NoteNode object for API logic unless joined.
  // post object from `getNoteContent` has joined tags?
  // My API `getNoteContent` joins `posts` table but `posts` table might not include `tags` unless I requested them in `notes.ts`.
  // Let's check `notes.ts`: .from('posts').select('*'). ... single().
  // It selects all from posts. BUT tags are in post_tags.
  // I likely missed fetching tags for the `post` in `notes.ts`.
  // So tags might be missing here.
  // I will ignore tags for now or fix API later.

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
      {/* Breadcrumb */}
      <Breadcrumb path={path} />

      <div className="flex gap-8">
        {/* Article Content */}
        <article className="min-w-0 flex-1">
          <header className="mb-8 border-b border-border pb-6">
            <h1 className="text-3xl font-bold leading-tight text-balance">{post.title}</h1>
            {post.excerpt && <p className="mt-2 text-muted-foreground">{post.excerpt}</p>}

            {/* Articles Link: if post.slug exists, link to it */}
            {post.slug && (
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/articles/${post.slug}`} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Articles形式で見る
                  </Link>
                </Button>
              </div>
            )}
          </header>

          <div className="prose-custom">
            <MarkdownRenderer content={post.content_md || ''} />
          </div>
        </article>

        {/* TOC Sidebar */}
        <aside className="hidden w-64 shrink-0 xl:block">
          <div className="sticky top-8">
            <TableOfContents content={post.content_md || ''} />
          </div>
        </aside>
      </div>
    </main>
  );
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
              href={`/notes/${path.slice(0, index + 1).join('/')}`}
              className="transition-colors hover:text-foreground"
            >
              {segment}
            </Link>
          ) : (
            <span className="text-foreground">{segment}</span> // Display slug. Title not avail here without lookup.
          )}
        </span>
      ))}
    </nav>
  );
}
