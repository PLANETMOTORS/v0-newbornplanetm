/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, ArrowRight, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { blogPostsMeta } from "@/lib/blog-data"

const POSTS_PER_PAGE = 9

// Normalised post shape — works for both Sanity and static data
export interface NormalisedPost {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
  image: string
}

interface BlogPageContentProps {
  /** Slug of the server-rendered featured post to exclude from the grid */
  featuredSlug?: string
  /** Posts from Sanity CMS — falls back to static lib/blog-data.ts when empty */
  initialPosts?: NormalisedPost[]
}

export function BlogPageContent({ featuredSlug, initialPosts }: BlogPageContentProps) {
  // Use Sanity posts when available, otherwise fall back to static data
  const allPosts = (initialPosts && initialPosts.length > 0 ? initialPosts : blogPostsMeta)
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const categories = [
    "All",
    ...Array.from(new Set(allPosts.map((p) => p.category))).sort(),
  ]

  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const filteredPosts = useMemo(() => {
    let result = allPosts
    // Skip the featured post that's already rendered server-side
    if (featuredSlug) {
      result = result.filter((p) => p.slug !== featuredSlug)
    }
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q)
      )
    }
    return result
  }, [selectedCategory, searchQuery, featuredSlug, allPosts])

  // Reset visible count when filters change
  const visiblePosts = filteredPosts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredPosts.length

  function handleLoadMore() {
    setIsLoadingMore(true)
    // Small delay for UX feedback
    setTimeout(() => {
      setVisibleCount((prev) => prev + POSTS_PER_PAGE)
      setIsLoadingMore(false)
    }, 300)
  }

  function handleCategoryChange(cat: string) {
    setSelectedCategory(cat)
    setVisibleCount(POSTS_PER_PAGE)
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setVisibleCount(POSTS_PER_PAGE)
  }

  return (
    <>
      {/* Search & Filters */}
      <section className="bg-muted/30 pb-12 lg:pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === selectedCategory ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="font-bold text-xl mb-8">
            {selectedCategory === "All" ? "All Articles" : selectedCategory}
            <span className="text-muted-foreground font-normal ml-2 text-base">
              ({filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"})
            </span>
          </h2>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground mb-4">
                No articles found{searchQuery ? ` for "${searchQuery}"` : ""}.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("All")
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {visiblePosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                      <div className="aspect-video overflow-hidden relative">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          quality={85}
                          className="object-cover group-hover:scale-105 transition-transform duration-300 will-change-transform"
                        />
                      </div>
                      <CardContent className="p-6">
                        <Badge variant="secondary" className="mb-3">
                          {post.category}
                        </Badge>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-12">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        Load More Articles
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-8">
            Subscribe to our newsletter for the latest car buying tips, industry news, and exclusive deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1"
            />
            <Button>Subscribe</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            No spam, unsubscribe at any time.
          </p>
        </div>
      </section>
    </>
  )
}
