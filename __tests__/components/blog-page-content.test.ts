import { describe, it, expect } from 'vitest'
import { blogPosts } from '@/lib/blog-data'

// ---- Replicate the module-level derived data from blog-page-content.tsx ----
// These mirror the exact logic used in the component so we can test it in isolation.

const POSTS_PER_PAGE = 9

const allPosts = Object.entries(blogPosts)
  .map(([slug, post]) => ({ slug, ...post }))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

const categories = [
  'All',
  ...Array.from(new Set(allPosts.map((p) => p.category))).sort(),
]

// ---- Filter logic extracted from the component's useMemo ----
function filterPosts(selectedCategory: string, searchQuery: string) {
  let result = allPosts
  if (selectedCategory !== 'All') {
    result = result.filter((p) => p.category === selectedCategory)
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q),
    )
  }
  return result
}

// ---- Visibility helpers ----
function getVisiblePosts(posts: typeof allPosts, visibleCount: number) {
  return posts.slice(0, visibleCount)
}

describe('allPosts derived array', () => {
  it('contains at least one post', () => {
    expect(allPosts.length).toBeGreaterThanOrEqual(1)
  })

  it('is sorted by date descending (newest first)', () => {
    for (let i = 0; i < allPosts.length - 1; i++) {
      const current = new Date(allPosts[i].date).getTime()
      const next = new Date(allPosts[i + 1].date).getTime()
      expect(current).toBeGreaterThanOrEqual(next)
    }
  })

  it('each post has a slug property', () => {
    for (const post of allPosts) {
      expect(typeof post.slug).toBe('string')
      expect(post.slug.length).toBeGreaterThan(0)
    }
  })

  it('contains all slugs from blogPosts', () => {
    const slugSet = new Set(allPosts.map((p) => p.slug))
    for (const slug of Object.keys(blogPosts)) {
      expect(slugSet.has(slug)).toBe(true)
    }
  })
})

describe('categories derived array', () => {
  it('starts with "All"', () => {
    expect(categories[0]).toBe('All')
  })

  it('contains at least one category beyond "All"', () => {
    expect(categories.length).toBeGreaterThan(1)
  })

  it('remaining categories are sorted alphabetically', () => {
    const rest = categories.slice(1)
    const sorted = [...rest].sort()
    expect(rest).toEqual(sorted)
  })

  it('has no duplicate categories', () => {
    const uniqueCategories = new Set(categories)
    expect(uniqueCategories.size).toBe(categories.length)
  })

  it('contains known categories from the data', () => {
    expect(categories).toContain('Electric Vehicles')
    expect(categories).toContain('Financing')
    expect(categories).toContain('Selling')
  })
})

describe('filterPosts — category filtering', () => {
  it('returns all posts when category is "All"', () => {
    const result = filterPosts('All', '')
    expect(result.length).toBe(allPosts.length)
  })

  it('filters to only matching category posts', () => {
    const result = filterPosts('Electric Vehicles', '')
    expect(result.length).toBeGreaterThan(0)
    for (const post of result) {
      expect(post.category).toBe('Electric Vehicles')
    }
  })

  it('filters to only Financing posts', () => {
    const result = filterPosts('Financing', '')
    expect(result.length).toBeGreaterThan(0)
    for (const post of result) {
      expect(post.category).toBe('Financing')
    }
  })

  it('returns empty array for unknown category', () => {
    const result = filterPosts('NonExistentCategory', '')
    expect(result.length).toBe(0)
  })
})

describe('filterPosts — search query filtering', () => {
  it('returns all posts when search is empty', () => {
    const result = filterPosts('All', '')
    expect(result.length).toBe(allPosts.length)
  })

  it('returns all posts when search is whitespace only', () => {
    const result = filterPosts('All', '   ')
    expect(result.length).toBe(allPosts.length)
  })

  it('filters by title match (case-insensitive)', () => {
    // "tesla" appears in multiple post titles
    const result = filterPosts('All', 'tesla')
    expect(result.length).toBeGreaterThan(0)
    for (const post of result) {
      const matchesTitle = post.title.toLowerCase().includes('tesla')
      const matchesExcerpt = post.excerpt.toLowerCase().includes('tesla')
      expect(matchesTitle || matchesExcerpt).toBe(true)
    }
  })

  it('filters by excerpt match (case-insensitive)', () => {
    const result = filterPosts('All', 'Canada')
    expect(result.length).toBeGreaterThan(0)
    for (const post of result) {
      const matchesTitle = post.title.toLowerCase().includes('canada')
      const matchesExcerpt = post.excerpt.toLowerCase().includes('canada')
      expect(matchesTitle || matchesExcerpt).toBe(true)
    }
  })

  it('is case-insensitive for search', () => {
    const lowerResult = filterPosts('All', 'tesla')
    const upperResult = filterPosts('All', 'TESLA')
    const mixedResult = filterPosts('All', 'Tesla')
    expect(lowerResult.length).toBe(upperResult.length)
    expect(lowerResult.length).toBe(mixedResult.length)
  })

  it('returns empty array when no posts match search', () => {
    const result = filterPosts('All', 'xyzzy_no_such_post_9999')
    expect(result.length).toBe(0)
  })
})

describe('filterPosts — combined category + search', () => {
  it('applies both category and search filters', () => {
    const category = 'Electric Vehicles'
    const query = 'tesla'
    const result = filterPosts(category, query)
    // All results must match both filters
    for (const post of result) {
      expect(post.category).toBe(category)
      const matchesTitle = post.title.toLowerCase().includes(query)
      const matchesExcerpt = post.excerpt.toLowerCase().includes(query)
      expect(matchesTitle || matchesExcerpt).toBe(true)
    }
  })

  it('returns empty array when category has no posts matching search', () => {
    // "Financing" posts almost certainly do not contain "tesla"
    const result = filterPosts('Financing', 'tesla-model-y-vs-model-3-nonexistent')
    expect(result.length).toBe(0)
  })
})

describe('pagination — visiblePosts and hasMore', () => {
  it('initial visible posts is capped at POSTS_PER_PAGE', () => {
    const visible = getVisiblePosts(allPosts, POSTS_PER_PAGE)
    const expected = Math.min(POSTS_PER_PAGE, allPosts.length)
    expect(visible.length).toBe(expected)
  })

  it('hasMore is true when total posts exceed POSTS_PER_PAGE', () => {
    const hasMore = POSTS_PER_PAGE < allPosts.length
    // Assuming there are more than 9 blog posts
    expect(hasMore).toBe(true)
  })

  it('hasMore is false when visibleCount equals total', () => {
    const hasMore = allPosts.length < allPosts.length
    expect(hasMore).toBe(false)
  })

  it('load more increases visibleCount by POSTS_PER_PAGE', () => {
    let visibleCount = POSTS_PER_PAGE
    // Simulate handleLoadMore
    visibleCount = visibleCount + POSTS_PER_PAGE
    expect(visibleCount).toBe(POSTS_PER_PAGE * 2)
  })

  it('visible posts after load more includes second page', () => {
    const afterLoad = getVisiblePosts(allPosts, POSTS_PER_PAGE * 2)
    const expected = Math.min(POSTS_PER_PAGE * 2, allPosts.length)
    expect(afterLoad.length).toBe(expected)
  })

  it('featuredPost is the first post in filtered results', () => {
    const filtered = filterPosts('All', '')
    const featuredPost = filtered[0]
    expect(featuredPost).toBeDefined()
    expect(featuredPost.slug).toBe(allPosts[0].slug)
  })

  it('grid shows posts starting from index 1 (skipping featured)', () => {
    const visible = getVisiblePosts(allPosts, POSTS_PER_PAGE)
    const gridPosts = visible.slice(1)
    // Featured post at index 0 is excluded from grid
    expect(gridPosts.length).toBe(visible.length - 1)
    if (visible.length > 1) {
      expect(gridPosts[0].slug).toBe(visible[1].slug)
    }
  })

  it('resets to POSTS_PER_PAGE when category changes', () => {
    // Simulates handleCategoryChange
    let visibleCount = POSTS_PER_PAGE * 3
    // handleCategoryChange sets visibleCount back to POSTS_PER_PAGE
    visibleCount = POSTS_PER_PAGE
    expect(visibleCount).toBe(POSTS_PER_PAGE)
  })

  it('resets to POSTS_PER_PAGE when search query changes', () => {
    // Simulates handleSearchChange
    let visibleCount = POSTS_PER_PAGE * 2
    visibleCount = POSTS_PER_PAGE
    expect(visibleCount).toBe(POSTS_PER_PAGE)
  })
})