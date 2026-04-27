#!/usr/bin/env node
/**
 * Refactor blog-posts to use createBlogPost() helper function
 * Converts inline BlogPostEntry objects to function calls to reduce 99% duplication
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all blog-posts files
const blogPostFiles = [
  'lib/blog-posts/ev-tesla.ts',
  'lib/blog-posts/trade-sell.ts',
  'lib/blog-posts/finance-tips.ts',
  'lib/blog-posts/market-news.ts'
];

let totalConversions = 0;

blogPostFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update import to include createBlogPost
  content = content.replace(
    /import type { BlogPostEntry } from "\.\.\/blog-data"/g,
    'import { createBlogPost, type BlogPostEntry } from "../blog-data"'
  );
  
  // Convert each blog post object to use createBlogPost
  // Pattern: "slug": { title: "...", excerpt: "...", ... }
  content = content.replace(
    /"([^"]+)":\s*{\s*title:\s*"([^"]+)",\s*excerpt:\s*"([^"]+)",\s*date:\s*"([^"]+)",\s*readTime:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*image:\s*"([^"]+)",\s*author:\s*"([^"]+)",\s*content:\s*`/gs,
    (match, slug, title, excerpt, date, readTime, category, image, author) => {
      totalConversions++;
      return `"${slug}": createBlogPost(\n    "${title}",\n    "${excerpt}",\n    "${date}",\n    "${readTime}",\n    "${category}",\n    "${image}",\n    "${author}",\n    \``;
    }
  );
  
  // Fix relatedPosts at the end: `, relatedPosts: [...] }
  content = content.replace(/,\s*relatedPosts:\s*(\[[^\]]+\])\s*}/g, ',\n    $1\n  )');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Refactored ${file}`);
});

console.log(`\n✅ Converted ${totalConversions} blog posts to use createBlogPost()`);
console.log('   - Should eliminate 99% duplication in blog-posts files');
