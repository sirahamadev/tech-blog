import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, FileDigit as FileList, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer';
import { TableOfContents } from '@/components/markdown/table-of-contents';
import { categoryInfo } from '@/lib/mock-data'; // カテゴリの表示名/説明など（MVPでは mock-data を流用）
import { api } from '@/lib/api';
import type { NoteNode, Post } from '@/types/api';

interface NotesPageProps {
  params: Promise<{
    path?: string[];
  }>;
}

export default async function NotesPage({ params }: NotesPageProps) {
  const { path = [] } = await params;

  /**
   * ツリー表示・パス解決のために note_nodes を全件取得する。
   *
   * - notes/tree は「フラット配列」を返す
   * - UI側で parent_id を使ってツリーを組み立てる
   *
   * ※本格運用なら、パス検索用APIや再帰CTE（WITH RECURSIVE）で部分取得も検討できるが、
   *   MVPでは「全件取得 → UIで解決」で十分。
   */
  const treeResponse = await api.getNoteTree();
  const allNodes = treeResponse.nodes;

  // /notes のトップ（pathなし）の場合は、概要ページを表示
  if (path.length === 0) {
    return <NotesOverview nodes={allNodes} />;
  }

  /**
   * URLのパス（例: /notes/backend/sql）の各セグメントを辿って、
   * 該当するノード（NoteNode）を特定する。
   *
   * 探し方：
   * - 「今いる親（currentParentId）」の直下にある
   * - slug が segment と一致する
   * という条件で子ノードを見つけていく。
   */
  let currentParentId: string | null = null;
  let targetNode: NoteNode | null = null;

  for (const segment of path) {
    // 親IDとslugで「次のノード」を探す（= ツリーを1段ずつ降りる）
    const found = allNodes.find((n) => n.parent_id === currentParentId && n.slug === segment);
    if (!found) {
      targetNode = null;
      break;
    }
    targetNode = found;
    currentParentId = found.id;
  }

  // パスに対応するノードが見つからない場合は 404 相当の画面を表示
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

  /**
   * ノードの詳細を取得する。
   * - node: note_nodes のレコード（title/slug/node_type/post_id/...）
   * - post: node_type === 'post' の場合のみ本文（posts）を返す（それ以外は null）
   */
  let contentResponse;
  try {
    contentResponse = await api.getNoteContent(targetNode.id);
  } catch {
    notFound();
  }
  const { node, post } = contentResponse;

  // フォルダの場合：子ノード一覧＋（任意で）overview記事の本文を表示
  if (node.node_type === 'folder') {
    // このフォルダ直下の子ノードを sort_order 順で取得
    const children = allNodes
      .filter((n) => n.parent_id === node.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    /**
     * フォルダ配下に "overview" という slug の post があれば、
     * それを「フォルダの説明（概要）」として上部に表示する。
     *
     * NOTE: overview の本文取得のために追加でAPIを叩くので、
     *       フォルダを開くたびに1回余分にリクエストが発生する（MVPなので許容）。
     *       将来的に重くなったら、API側でまとめて返す/キャッシュする等を検討。
     */
    let overviewContent = '';
    const overviewNode = children.find((c) => c.node_type === 'post' && c.slug === 'overview');

    if (overviewNode) {
      try {
        const ovRes = await api.getNoteContent(overviewNode.id);
        overviewContent = ovRes.post?.content_md || '';
      } catch (e) {
        // 取得失敗してもフォルダ表示自体はできるので無視
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

  // 記事の場合：本文を表示（post が null ならデータ不整合なのでフォールバック）
  if (post) {
    return <ArticleView node={node} post={post} path={path} />;
  } else {
    // 本来起きない想定（node_type=post なのに post が取れない等）なので簡易表示
    return <div>Content not found</div>;
  }
}

function NotesOverview({ nodes }: { nodes: NoteNode[] }) {
  // ルート直下（parent_id === null）のフォルダだけをトップカードとして表示
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
          // MVPでは mock-data にあるカテゴリ情報（名前/説明）を流用
          const info = categoryInfo[folder.slug as keyof typeof categoryInfo] || {
            name: folder.title,
            description: folder.title,
          };

          /**
           * フォルダ配下にある「記事(post)」の数を（再帰で）数える。
           * - 子が folder ならさらに潜る
           * - 子が post ならカウントする
           *
           * NOTE: nodes 全件に対して filter を何度も呼ぶので、ノードが増えると重い。
           *       本格化するなら parent_id→children のMapを作って高速化するのがよい。
           */
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
  // overview は上部に表示するので、一覧からは除外
  const displayChildren = childrenNodes.filter((c) => c.slug !== 'overview');

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 lg:py-12">
      {/* パンくず */}
      <Breadcrumb path={path} />

      {/* フォルダ見出し */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold capitalize">{node.title}</h1>
      </header>

      {/* フォルダ概要（overview） */}
      {overviewContent && (
        <div className="mb-8 rounded-lg border border-border p-6 prose-custom">
          <MarkdownRenderer content={overviewContent} />
        </div>
      )}

      {/* 子ノード一覧 */}
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
                {/*
                  NoteNode だけだと excerpt が無い（本文は posts にある）ので、ここでは出さない。
                  必要なら「ツリー取得APIでexcerptも返す」か「ここで詳細APIを叩く」など方針を決める。
                */}
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
  /**
   * NOTE: 現状の /notes/content/:id は posts を select('*') しているだけなので、
   * tags（post_tags → tags）までは取れていない可能性がある。
   * Notes側の記事でタグを表示したいなら、API側で tags も結合して返す必要がある。
   *
   * いったんMVPではタグ表示は無しでOK。
   */
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
      {/* パンくず */}
      <Breadcrumb path={path} />

      <div className="flex gap-8">
        {/* 本文 */}
        <article className="min-w-0 flex-1">
          <header className="mb-8 border-b border-border pb-6">
            <h1 className="text-3xl font-bold leading-tight text-balance">{post.title}</h1>
            {post.excerpt && <p className="mt-2 text-muted-foreground">{post.excerpt}</p>}

            {/* Articles（ブログ形式）に戻るリンク（post.slug がある場合のみ） */}
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

        {/* 目次（TOC） */}
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
            // 本当は title を表示したいが、ここでは path（slug）しか持っていないため slug を出している
            <span className="text-foreground">{segment}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
