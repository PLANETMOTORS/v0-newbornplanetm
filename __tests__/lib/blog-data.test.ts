/**
 * Tests for lib/blog-data.ts
 *
 * The PR changes the image path for the "tesla-warranty-used-cars" post:
 *   Before: https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&h=600&fit=crop
 *   After:  /images/blog/IMG_1903-2-scaled.jpg
 *
 * Also validates the overall blogPosts data structure to prevent regressions.
 */

import { describe, it, expect } from 'vitest'
import { blogPosts, createBlogPost } from '@/lib/blog-data'

// ---------------------------------------------------------------------------
// createBlogPost factory — covers the new helper added in this PR
// ---------------------------------------------------------------------------
describe('createBlogPost', () => {
  const post = createBlogPost(
    {
      title: 'Test Title',
      excerpt: 'Test excerpt',
      date: 'Jan 01, 2026',
      readTime: '5 min read',
      category: 'Testing',
      image: '/images/blog/test.jpg',
      author: 'Test Author',
    },
    '<p>Content</p>',
    ['related-slug-1', 'related-slug-2']
  )

  it('returns an object with all required BlogPostEntry fields', () => {
    expect(post.title).toBe('Test Title')
    expect(post.excerpt).toBe('Test excerpt')
    expect(post.date).toBe('Jan 01, 2026')
    expect(post.readTime).toBe('5 min read')
    expect(post.category).toBe('Testing')
    expect(post.image).toBe('/images/blog/test.jpg')
    expect(post.author).toBe('Test Author')
    expect(post.content).toBe('<p>Content</p>')
    expect(post.relatedPosts).toEqual(['related-slug-1', 'related-slug-2'])
  })

  it('returns a plain object (not a class instance)', () => {
    expect(Object.getPrototypeOf(post)).toBe(Object.prototype)
  })

  it('relatedPosts is always an array', () => {
    expect(Array.isArray(post.relatedPosts)).toBe(true)
  })

  it('accepts an empty relatedPosts array', () => {
    const p = createBlogPost(
    {
      title: 'T',
      excerpt: 'E',
      date: 'D',
      readTime: 'R',
      category: 'C',
      image: '/images/blog/x.jpg',
      author: 'A',
    },
    'content',
    []
  )
    expect(p.relatedPosts).toEqual([])
  })
})

describe('blogPosts', () => {
  it('is an object (record of posts)', () => {
    expect(typeof blogPosts).toBe('object')
    expect(blogPosts).not.toBeNull()
  })

  it('contains at least one post', () => {
    expect(Object.keys(blogPosts).length).toBeGreaterThan(0)
  })

  it('every post has the required fields', () => {
    for (const [slug, post] of Object.entries(blogPosts)) {
      expect(typeof post.title, `post "${slug}" missing title`).toBe('string')
      expect(post.title.length, `post "${slug}" has empty title`).toBeGreaterThan(0)

      expect(typeof post.excerpt, `post "${slug}" missing excerpt`).toBe('string')
      expect(typeof post.date, `post "${slug}" missing date`).toBe('string')
      expect(typeof post.readTime, `post "${slug}" missing readTime`).toBe('string')
      expect(typeof post.category, `post "${slug}" missing category`).toBe('string')
      expect(typeof post.image, `post "${slug}" missing image`).toBe('string')
      expect(typeof post.author, `post "${slug}" missing author`).toBe('string')
      expect(typeof post.content, `post "${slug}" missing content`).toBe('string')
    }
  })

  it('every image path starts with /images/', () => {
    for (const [slug, post] of Object.entries(blogPosts)) {
      expect(post.image, `post "${slug}" has unexpected image path`).toMatch(/^\/images\//)
    }
  })
})

describe('tesla-warranty-used-cars post (image path change in PR)', () => {
  it('exists in blogPosts', () => {
    expect(blogPosts['tesla-warranty-used-cars']).toBeDefined()
  })

  it('uses the self-hosted image', () => {
    const post = blogPosts['tesla-warranty-used-cars']
    expect(post.image).toBe('/images/blog/IMG_1903-2-scaled.jpg')
  })

  it('does NOT use the old external Unsplash URL', () => {
    const post = blogPosts['tesla-warranty-used-cars']
    expect(post.image).not.toMatch(/unsplash/)
  })

  it('ends with a valid image extension', () => {
    const post = blogPosts['tesla-warranty-used-cars']
    expect(post.image).toMatch(/\.(jpg|png|webp)$/)
  })

  it('is a local path, not an external URL', () => {
    const post = blogPosts['tesla-warranty-used-cars']
    expect(post.image.startsWith('/images/')).toBe(true)
  })

  it('has the correct title', () => {
    const post = blogPosts['tesla-warranty-used-cars']
    expect(post.title).toBe('Tesla Warranty for Used Cars: What You Need to Know')
  })

  it('is categorized as Electric Vehicles', () => {
    const post = blogPosts['tesla-warranty-used-cars']
    expect(post.category).toBe('Electric Vehicles')
  })

  it('has content that is non-empty', () => {
    const post = blogPosts['tesla-warranty-used-cars']
    expect(post.content.trim().length).toBeGreaterThan(0)
  })
})

describe('blogPosts — no post uses external image URLs', () => {
  it('no post uses an external URL for its image', () => {
    for (const [slug, post] of Object.entries(blogPosts)) {
      expect(post.image, `post "${slug}" still uses an external URL`).toMatch(/^\/images\//)
    }
  })
})