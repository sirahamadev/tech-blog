import Link from 'next/link';
import { ArrowRight, Code, Award, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArticleCard } from '@/components/articles/article-card';
import { api } from '@/lib/api';
import { categoryInfo } from '@/lib/mock-data'; // ←ひとまずこれだけ残してもOK（後で lib/category-info.ts に移す）
import type { PostSummary } from '@/types/api';

const categories = ['projects', 'certifications', 'notes'] as const;

const categoryIcons = {
  projects: Code,
  certifications: Award,
  notes: FileText,
} as const;

export default async function HomePage() {
  // ✅ 全記事を取る（Homeは件数+最新用なので limit 大きめ or 無制限）
  const res = await api.getPosts({ limit: 200 }); // 適当に大きめ（MVP）
  const posts = (res as any).posts as PostSummary[]; // ← posts じゃなかったらここを直す

  // ✅ 最新3件（published_date を使う）
  const latestPosts = [...posts]
    .sort(
      (a, b) =>
        new Date(b.published_date ?? '').getTime() - new Date(a.published_date ?? '').getTime(),
    )
    .slice(0, 3);

  // ✅ カテゴリ件数
  const counts = posts.reduce<Record<string, number>>((acc, p) => {
    const c = p.category;
    if (c) acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  const categoryCards = categories.map((key) => ({
    key,
    icon: categoryIcons[key],
    count: counts[key] ?? 0,
  }));

  return (
    <main className="relative">
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">Software Engineer</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-balance md:text-5xl">
            こんにちは、sirahamaです
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            このサイトでは、個人プロジェクトや取得した資格、日々の学習ノートを公開しています。
            技術力とアウトプットの全体像をご覧いただけます。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-semibold">Explore</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryCards.map((category) => {
            const info = categoryInfo[category.key];

            return (
              <Link key={category.key} href={`/articles?category=${category.key}`}>
                <Card className="h-full transition-all hover:border-foreground/20 hover:shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <category.icon className="h-5 w-5" />
                    </div>

                    <div>
                      <CardTitle className="text-lg">{info.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{category.count} 件の記事</p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Latest</h2>
          <Link
            href="/articles"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            すべて見る
            <ArrowRight className="ml-1 inline-block h-3 w-3" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latestPosts.map((post) => (
            <ArticleCard key={post.id} article={post} />
          ))}
        </div>
      </section>
    </main>
  );
}
