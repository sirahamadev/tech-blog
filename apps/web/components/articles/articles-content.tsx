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

const categories = ['all', 'projects', 'certifications', 'notes'] as const;

interface ArticlesContentProps {
  posts: PostSummary[];
  tags: TagWithCount[];
}

export function ArticlesContent({ posts, tags }: ArticlesContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state
  const currentCategory = searchParams.get('category') || 'all';
  const currentTag = searchParams.get('tag') || '';
  const currentQ = searchParams.get('q') || '';

  // Local state for input
  const [searchQuery, setSearchQuery] = useState(currentQ);

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== currentQ) {
        updateFilter('q', searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset page on filter change
    if (key !== 'page') {
      params.delete('page');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleTag = (tagSlug: string) => {
    // Single select for now to match API
    if (currentTag === tagSlug) {
      updateFilter('tag', null);
    } else {
      updateFilter('tag', tagSlug);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    router.push(pathname);
  };

  const hasActiveFilters = currentCategory !== 'all' || !!currentTag || !!currentQ;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Articles</h1>
        <p className="mt-2 text-muted-foreground">カテゴリやタグで記事を探す</p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
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

        {/* Category Filter */}
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

        {/* Tag Filter */}
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

        {/* Clear Filters */}
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

      {/* Results */}
      <div className="mb-4 text-sm text-muted-foreground">{posts.length} 件の記事</div>

      {/* Article Grid */}
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
