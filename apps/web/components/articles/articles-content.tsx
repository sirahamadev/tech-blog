'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArticleCard } from '@/components/articles/article-card';
import { categoryInfo } from '@/lib/mock-data';
import type { PostSummary, TagWithCount } from '@/types/api';

/**
 * 記事一覧で使用するカテゴリ一覧
 * - URLクエリにもそのまま載せるため、定数として管理
 */
const categories = ['all', 'projects', 'certifications', 'notes'] as const;

interface ArticlesContentProps {
  posts: PostSummary[];
  tags: TagWithCount[];
}

/**
 * Articles 一覧画面のメインコンテンツ
 * - 検索 / カテゴリ / タグによる絞り込みUI
 * - 絞り込み状態は URL クエリで管理する
 */
export function ArticlesContent({ posts, tags }: ArticlesContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * 現在の URL クエリから絞り込み状態を取得
   * - URL を single source of truth にすることで、
   *   ・リロード耐性
   *   ・URL共有
   *   を実現している
   */
  const currentCategory = searchParams.get('category') || 'all';
  const currentTag = searchParams.get('tag') || '';
  const currentQ = searchParams.get('q') || '';

  /**
   * 検索入力欄用のローカル state
   * - URL(q)とは即時同期せず、debounce 用に分離
   */
  const [searchQuery, setSearchQuery] = useState(currentQ);

  /**
   * 検索文字列の debounce 処理
   * - 入力のたびに URL を更新すると UX が悪いため、
   *   500ms 待ってから URL を更新する
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== currentQ) {
        updateFilter('q', searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * URL クエリを更新する共通関数
   * - value が null / 'all' の場合はクエリから削除
   * - フィルター変更時はページ番号をリセット
   */
  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // フィルター変更時はページングをリセットする想定
    if (key !== 'page') {
      params.delete('page');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  /**
   * タグの切り替え処理
   * - 現在は API 仕様に合わせて単一選択
   * - 同じタグを再クリックすると解除
   */
  const toggleTag = (tagSlug: string) => {
    if (currentTag === tagSlug) {
      updateFilter('tag', null);
    } else {
      updateFilter('tag', tagSlug);
    }
  };

  /**
   * すべてのフィルターを解除
   * - URL クエリをクリア
   * - 検索入力欄も初期化
   */
  const clearFilters = () => {
    setSearchQuery('');
    router.push(pathname);
  };

  /**
   * 何らかのフィルターが有効かどうか
   * - 「フィルターをクリア」ボタンの表示制御に使用
   */
  const hasActiveFilters = currentCategory !== 'all' || !!currentTag || !!currentQ;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Articles</h1>
        <p className="mt-2 text-muted-foreground">カテゴリやタグで記事を探す</p>
      </div>

      {/* フィルター群 */}
      <div className="mb-8 space-y-4">
        {/* 検索入力 */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="記事を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* カテゴリフィルター */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={currentCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('category', category)}
            >
              {category === 'all' ? 'All' : categoryInfo[category].name}
            </Button>
          ))}
        </div>

        {/* タグフィルター */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.slug}
              variant={currentTag === tag.slug ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTag(tag.slug)}
            >
              {tag.name}
              {tag.count > 0 && <span className="ml-1 opacity-70">({tag.count})</span>}
            </Badge>
          ))}
        </div>

        {/* フィルター解除 */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3 w-3" />
            フィルターをクリア
          </Button>
        )}
      </div>

      {/* 検索結果件数 */}
      <div className="mb-4 text-sm text-muted-foreground">{posts.length} 件の記事</div>

      {/* 記事一覧 */}
      {posts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.id} article={post} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">条件に一致する記事が見つかりませんでした</p>
          <Button variant="link" onClick={clearFilters}>
            フィルターをクリア
          </Button>
        </div>
      )}
    </main>
  );
}
