/**
 * Tests for lib/blog-data.ts
 *
 * The PR changes the image path for the "tesla-warranty-used-cars" post:
 *   Before: /images/blog/IMG_1903-2-scaled.png
 *   After:  /images/blog/IMG_1903-2-scaled.jpg
 *
 * Also validates the overall blogPosts data structure to prevent regressions.
 */

import { describe, it, expect } from 'vitest'
import { blogPosts } from '@/lib/blog-data'

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

  it('uses the .png image', () => {
    const post = blogPosts['tesla-warranty-used-cars']
    expect(post.image).toBe('/images/blog/IMG_1903-2-scaled.png')
  })

  it('does NOT use a .jpg image path', () => {
    const post = blogPosts['tesla-warranty-used-cars']
    expect(post.image).not.toBe('/images/blog/IMG_1903-2-scaled.jpg')
  })

  it('ends with .png', () => {
    const post = blogPosts['tesla-warranty-used-cars']
    expect(post.image.endsWith('.png')).toBe(true)
  })

  it('does not end with .jpg', () => {
    const post = blogPosts['tesla-warranty-used-cars']
    expect(post.image.endsWith('.jpg')).toBe(false)
  })
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

describe('blogPosts — no other post uses the old .png image path', () => {
  it('no post points to IMG_1903-2-scaled.png', () => {
    for (const post of Object.values(blogPosts)) {
      expect(post.image).not.toBe('/images/blog/IMG_1903-2-scaled.png')
    }
  })
})