"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArticleCard } from "@/components/articles/article-card"
import { getAllPosts, getAllTags, categoryInfo } from "@/lib/mock-data"

const categories = ["all", "projects", "certifications", "notes"] as const

export function ArticlesContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || "all"

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const allPosts = getAllPosts()
  const allTags = getAllTags()

  const filteredPosts = useMemo(() => {
    return allPosts
      .filter((post) => {
        // カテゴリフィルター
        if (selectedCategory !== "all" && post.category !== selectedCategory) {
          return false
        }
        // タグフィルター
        if (selectedTags.length > 0 && !selectedTags.some((tag) => post.tags?.includes(tag))) {
          return false
        }
        // 検索フィルター
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            post.title?.toLowerCase().includes(query) ||
            post.excerpt?.toLowerCase().includes(query) ||
            post.tags?.some((tag) => tag.toLowerCase().includes(query))
          )
        }
        return true
      })
      .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
  }, [allPosts, selectedCategory, selectedTags, searchQuery])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearFilters = () => {
    setSelectedCategory("all")
    setSelectedTags([])
    setSearchQuery("")
  }

  const hasActiveFilters = selectedCategory !== "all" || selectedTags.length > 0 || searchQuery !== ""

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
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === "all" ? "All" : categoryInfo[category].name}
            </Button>
          ))}
        </div>

        {/* Tag Filter */}
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" />
            フィルターをクリア
          </Button>
        )}
      </div>

      {/* Results */}
      <div className="mb-4 text-sm text-muted-foreground">{filteredPosts.length} 件の記事</div>

      {/* Article Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
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
  )
}
