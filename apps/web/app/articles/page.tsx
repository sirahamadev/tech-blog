import { Suspense } from 'react';
import { ArticlesContent } from '@/components/articles/articles-content';
import { api } from '@/lib/api';

interface ArticlesPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const page = Number(params.page || '1');

  const [postsResponse, tagsResponse] = await Promise.all([
    api.getPosts({
      page,
      category: params.category,
      tag: params.tag,
      q: params.q,
    }),
    api.getTags(),
  ]);

  return (
    <Suspense fallback={<ArticlesLoading />}>
      <ArticlesContent posts={postsResponse.items} tags={tagsResponse.items} />
    </Suspense>
  );
}

function ArticlesLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        <div className="mt-2 h-5 w-48 bg-muted animate-pulse rounded" />
      </div>
    </main>
  );
}
