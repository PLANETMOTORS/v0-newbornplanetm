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
  ogTitle?: string
  ogDescription?: string
}

/**
 * Helper factory to create blog post entries — eliminates structural
 * duplication across all posts.
 *
 * The arg list was wide enough (9 fields) to trip Sonar S107 ("too many
 * parameters"), so meta-fields are bundled into a single `meta` object and
 * `content` / `relatedPosts` stay as the trailing positional args because
 * those are the only ones a typical post needs to override per-call.
 */
export interface BlogPostFields {
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
  image: string
  author: string
  ogTitle?: string
  ogDescription?: string
}

export function createBlogPost(
  meta: BlogPostFields,
  content: string,
  relatedPosts: string[],
): BlogPostEntry {
  return { ...meta, content, relatedPosts }
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

// BlogPostMeta and blogPostsMeta live in a standalone module so client
// components can import metadata without pulling in the large content strings.
export type { BlogPostMeta } from "./blog-posts-meta"
export { blogPostsMeta } from "./blog-posts-meta"
