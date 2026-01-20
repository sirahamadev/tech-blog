import Link from 'next/link';
import { ArrowRight, Code, Award, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArticleCard } from '@/components/articles/article-card';
import { getAllPosts, getPostsByCategory, categoryInfo } from '@/lib/mock-data';

/**
 * トップページで表示するカテゴリカードの定義
 *
 * - key: 記事カテゴリ（URLクエリやデータ取得に使用）
 * - icon: カテゴリごとのアイコン
 * - count: 該当カテゴリの記事件数
 *
 * ※ Server Component なので、ここでデータ取得しても問題ない
 */
const categoryCards = [
  {
    key: 'projects' as const,
    icon: Code,
    count: getPostsByCategory('projects').length,
  },
  {
    key: 'certifications' as const,
    icon: Award,
    count: getPostsByCategory('certifications').length,
  },
  {
    key: 'notes' as const,
    icon: FileText,
    count: getPostsByCategory('notes').length,
  },
];

/**
 * トップページ（Server Component）
 *
 * - サーバー上で実行される
 * - データ取得・整形をここで行い、HTMLを生成する
 * - useState / useEffect は使わない設計
 */
export default function HomePage() {
  /**
   * 最新記事を取得
   *
   * - 全記事を取得
   * - 公開日で降順ソート
   * - 上位3件だけ表示
   *
   * ※ ページがレンダリングされるたびにサーバーで実行される
   */
  const latestPosts = getAllPosts()
    .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
    .slice(0, 3);

  return (
    <main className="relative">
      {/* ヒーローセクション：サイトの概要と自己紹介 */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">Software Engineer</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-balance md:text-5xl">
            こんにちは、sirahamaです
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            このサイトでは、個人プロジェクトや取得した資格、 日々の学習ノートを公開しています。
            技術力とアウトプットの全体像をご覧いただけます。
          </p>
        </div>
      </section>

      {/* カテゴリ探索セクション：Projects / Certifications / Notes */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-semibold">Explore</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryCards.map((category) => {
            const info = categoryInfo[category.key];

            return (
              <Link key={category.key} href={`/articles?category=${category.key}`}>
                <Card className="h-full transition-all hover:border-foreground/20 hover:shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    {/* カテゴリアイコン */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <category.icon className="h-5 w-5" />
                    </div>

                    {/* カテゴリ名と記事数 */}
                    <div>
                      <CardTitle className="text-lg">{info.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{category.count} 件の記事</p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex items-center justify-between">
                    {/* カテゴリ説明 */}
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 最新記事セクション */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Latest</h2>

          {/* 記事一覧ページへの導線 */}
          <Link
            href="/articles"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            すべて見る
            <ArrowRight className="ml-1 inline-block h-3 w-3" />
          </Link>
        </div>

        {/* 最新記事カード一覧 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latestPosts.map((post) => (
            <ArticleCard key={post.id} article={post} />
          ))}
        </div>
      </section>
    </main>
  );
}
