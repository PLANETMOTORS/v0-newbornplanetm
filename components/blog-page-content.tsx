"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, ArrowRight, Search, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { blogPosts } from "@/lib/blog-data"

const POSTS_PER_PAGE = 9

// Build sorted post array from the single source of truth (blog-data.ts)
const allPosts = Object.entries(blogPosts)
  .map(([slug, post]) => ({ slug, ...post }))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

const categories = [
  "All",
  ...Array.from(new Set(allPosts.map((p) => p.category))).sort(),
]

export function BlogPageContent() {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const filteredPosts = useMemo(() => {
    let result = allPosts
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
  }, [selectedCategory, searchQuery])

  // Reset visible count when filters change
  const visiblePosts = filteredPosts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredPosts.length
  const featuredPost = filteredPosts[0]

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
    <main id="main-content" tabIndex={-1} className="pt-24 pb-20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
      {/* Hero */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold">
              Planet Motors Blog
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Expert advice on car buying, financing tips, EV trends, and automotive news for Canadian drivers.
            </p>
          </div>

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

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="font-semibold text-xl mb-6">Featured Article</h2>

            <Link href={`/blog/${featuredPost.slug}`} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video md:aspect-auto relative">
                    <Image
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-8 flex flex-col justify-center">
                    <Badge variant="secondary" className="w-fit mb-4">
                      {featuredPost.category}
                    </Badge>
                    <h3 className="font-serif text-2xl md:text-3xl font-semibold mb-4 group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {featuredPost.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
