import { Suspense } from "react"
import { ArticlesContent } from "@/components/articles/articles-content"

export default function ArticlesPage() {
  return (
    <Suspense fallback={<ArticlesLoading />}>
      <ArticlesContent />
    </Suspense>
  )
}

function ArticlesLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        <div className="mt-2 h-5 w-48 bg-muted animate-pulse rounded" />
      </div>
    </main>
  )
}
