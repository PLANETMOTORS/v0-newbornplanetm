import { describe, it, expect } from 'vitest'
import { blogPosts } from '@/lib/blog-data'

describe('blogPosts data integrity', () => {
  const entries = Object.entries(blogPosts)
  const slugs = Object.keys(blogPosts)

  it('exports at least one blog post', () => {
    expect(entries.length).toBeGreaterThanOrEqual(1)
  })

  it('all slugs are unique', () => {
    const uniqueSlugs = new Set(slugs)
    expect(uniqueSlugs.size).toBe(slugs.length)
  })

  it('all slugs are non-empty strings', () => {
    for (const slug of slugs) {
      expect(typeof slug).toBe('string')
      expect(slug.length).toBeGreaterThan(0)
    }
  })

  it('every post has a non-empty title', () => {
    for (const [slug, post] of entries) {
      expect(post.title, `post "${slug}" missing title`).toBeTruthy()
      expect(typeof post.title).toBe('string')
    }
  })

  it('every post has a non-empty excerpt', () => {
    for (const [slug, post] of entries) {
      expect(post.excerpt, `post "${slug}" missing excerpt`).toBeTruthy()
      expect(typeof post.excerpt).toBe('string')
    }
  })

  it('every post has a parseable date', () => {
    for (const [slug, post] of entries) {
      const parsed = Date.parse(post.date)
      expect(Number.isFinite(parsed), `post "${slug}" has unparseable date: "${post.date}"`).toBe(true)
    }
  })

  it('every post has a non-empty readTime', () => {
    for (const [slug, post] of entries) {
      expect(post.readTime, `post "${slug}" missing readTime`).toBeTruthy()
      expect(typeof post.readTime).toBe('string')
    }
  })

  it('every post has a non-empty category', () => {
    for (const [slug, post] of entries) {
      expect(post.category, `post "${slug}" missing category`).toBeTruthy()
      expect(typeof post.category).toBe('string')
    }
  })

  it('every post has an image path', () => {
    for (const [slug, post] of entries) {
      expect(post.image, `post "${slug}" missing image`).toBeTruthy()
      expect(typeof post.image).toBe('string')
    }
  })

  it('every post has an author', () => {
    for (const [slug, post] of entries) {
      expect(post.author, `post "${slug}" missing author`).toBeTruthy()
      expect(typeof post.author).toBe('string')
    }
  })

  it('every post has content', () => {
    for (const [slug, post] of entries) {
      expect(post.content, `post "${slug}" missing content`).toBeTruthy()
      expect(typeof post.content).toBe('string')
    }
  })

  it('every post has a relatedPosts array', () => {
    for (const [slug, post] of entries) {
      expect(Array.isArray(post.relatedPosts), `post "${slug}" relatedPosts is not an array`).toBe(true)
    }
  })

  it('relatedPosts references only existing slugs', () => {
    for (const [slug, post] of entries) {
      for (const relatedSlug of post.relatedPosts) {
        expect(
          slugs.includes(relatedSlug),
          `post "${slug}" has relatedPost "${relatedSlug}" which does not exist`
        ).toBe(true)
      }
    }
  })

  it('categories include expected values', () => {
    const categories = new Set(entries.map(([, post]) => post.category))
    // Verify known categories are present in the data set
    expect(categories.has('Electric Vehicles')).toBe(true)
    expect(categories.has('Financing')).toBe(true)
    expect(categories.has('Selling')).toBe(true)
  })

  it('every post date comes before or on today', () => {
    const now = Date.now()
    for (const [slug, post] of entries) {
      const ts = Date.parse(post.date)
      // Allow a small buffer for timezone differences (1 day in ms)
      expect(ts, `post "${slug}" date is far in the future`).toBeLessThanOrEqual(now + 86_400_000)
    }
  })
})