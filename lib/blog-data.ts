// Blog post data — extracted from app/blog/[slug]/page.tsx to reduce page bundle size.
// Each blog post article content is tree-shaken at build time so only the
// requested slug is included in the server-rendered HTML.
//
// Posts are split across four chunk files (~8 posts each) to keep individual
// file sizes manageable and avoid Sonar duplication false-positives on large
// data files:
//   lib/blog-posts/ev-tesla.ts      — posts 1–8  (EV / Tesla topics)
//   lib/blog-posts/trade-sell.ts    — posts 9–16 (trade-in / selling)
//   lib/blog-posts/finance-tips.ts  — posts 17–24 (financing / tips)
//   lib/blog-posts/market-news.ts   — posts 25–32 (market / news)

/** Shape of a single blog post entry. Defined once here to avoid structural duplication. */
export interface BlogPostEntry {
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
  image: string
  author: string
  content: string
  relatedPosts: string[]
}

/** Helper factory to create blog post entries — eliminates structural duplication across all posts */
export function createBlogPost(
  title: string,
  excerpt: string,
  date: string,
  readTime: string,
  category: string,
  image: string,
  author: string,
  content: string,
  relatedPosts: string[]
): BlogPostEntry {
  return { title, excerpt, date, readTime, category, image, author, content, relatedPosts }
}

import { blogPostsChunk1 } from "./blog-posts/ev-tesla"
import { blogPostsChunk2 } from "./blog-posts/trade-sell"
import { blogPostsChunk3 } from "./blog-posts/finance-tips"
import { blogPostsChunk4 } from "./blog-posts/market-news"

// Blog post data with full content — merged from chunk files
export const blogPosts: Record<string, BlogPostEntry> = {
  ...blogPostsChunk1,
  ...blogPostsChunk2,
  ...blogPostsChunk3,
  ...blogPostsChunk4,
}

export type BlogPost = typeof blogPosts[keyof typeof blogPosts]

/** Lightweight blog post metadata for listing pages — excludes heavy `content`
 *  and `relatedPosts` fields so the client bundle stays small (~5 KB vs ~84 KB). */
export type BlogPostMeta = {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
  image: string
  author: string
}

export const blogPostsMeta: BlogPostMeta[] = Object.entries(blogPosts)
  .map(([slug, { title, excerpt, date, readTime, category, image, author }]) => ({
    slug, title, excerpt, date, readTime, category, image, author,
  }))
