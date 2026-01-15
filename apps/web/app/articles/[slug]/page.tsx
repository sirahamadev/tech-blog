import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer';
import { TableOfContents } from '@/components/markdown/table-of-contents';
import { api } from '@/lib/api';
import type { NoteNode } from '@/types/api';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Build path string from tree for a given node ID
function findPath(nodes: NoteNode[], targetId: string): string | null {
  // Helper to build parent map
  const parentMap = new Map<string, string | null>();
  const nodeMap = new Map<string, NoteNode>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    if (node.parent_id) {
      parentMap.set(node.id, node.parent_id);
    }
  }

  if (!nodeMap.has(targetId)) return null;

  const pathSegments: string[] = [];
  let curr: string | null = targetId;

  while (curr) {
    const node = nodeMap.get(curr);
    if (!node) break;
    pathSegments.unshift(node.slug); // or name? API has slug and name? NoteNode has slug and title. URL path usually uses slug or name? Mock used name?
    // Notes page uses `path` array which matches against `getNodeByPath`. `getNodeByPath` matched `n.name`.
    // My NoteNode has `slug`. Let's assume slug is the path segment.
    curr = parentMap.get(curr) || null;
  }

  return pathSegments.join('/');
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  let article;
  try {
    article = await api.getPostBySlug(slug);
  } catch (e) {
    notFound();
  }

  let notesPath: string | null = null;
  if (article.note_node_id) {
    try {
      const tree = await api.getNoteTree();
      // API returns flat nodes list in `nodes`, plus `root` (which we might ignore if we just search all nodes?
      // note_nodes table has root nodes too. `nodes` in response usually has everything if I implemented it right or at least descendants.
      // My `getNoteTree` implementation returns ALL nodes if root param is missing.
      // `nodes` array in response.
      notesPath = findPath(tree.nodes, article.note_node_id);
    } catch (e) {
      console.error('Failed to resolve note path', e);
    }
  }

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
              <time dateTime={article.published_date}>{article.published_date}</time>
              {article.category && (
                <Badge variant="outline" className="ml-2">
                  {article.category}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold leading-tight text-balance md:text-4xl">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="mt-3 text-lg text-muted-foreground">{article.excerpt}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags?.map((tag) => (
                <Badge key={tag.slug} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>

            {/* Notes Link */}
            {notesPath && (
              <div className="mt-6">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/notes/${notesPath}`} className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Notes形式で開く
                  </Link>
                </Button>
              </div>
            )}
          </header>

          {/* Article Body */}
          <div className="prose-custom max-w-none">
            <MarkdownRenderer content={article.content_md || ''} />
          </div>
        </article>

        {/* Sidebar - TOC */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20">
            <TableOfContents content={article.content_md || ''} />
          </div>
        </aside>
      </div>
    </main>
  );
}
