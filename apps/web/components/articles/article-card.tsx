import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PostSummary } from '@/types/api';

interface ArticleCardProps {
  article: PostSummary;
}

export function ArticleCard({ article }: ArticleCardProps) {
  // PostSummary has published_date, mocks had date.
  const date = article.published_date;

  return (
    <Link href={`/articles/${article.slug}`}>
      <Card className="h-full transition-colors hover:bg-accent/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <time dateTime={date}>{date}</time>
            {article.category && (
              <Badge variant="outline" className="ml-auto text-xs">
                {article.category}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <h3 className="font-semibold leading-tight line-clamp-2">{article.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
          <div className="flex flex-wrap gap-1 pt-2">
            {article.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
