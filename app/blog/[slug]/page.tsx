/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { getPublicSiteUrl } from "@/lib/site-url"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import sanitizeHtml from "sanitize-html"
import { blogPosts } from "@/lib/blog-data"
import { getBlogPost, getBlogSlugs } from "@/lib/sanity/fetch"
import { BlogShareButtons } from "@/components/blog/blog-share-buttons"

// Allow slugs not returned by generateStaticParams (new Sanity posts) to be served via ISR
export const dynamicParams = true

/** Convert Sanity Portable Text blocks to an HTML string for dangerouslySetInnerHTML. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function portableTextToHtml(blocks: any[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return ""
  return blocks.map((block) => {
    if (block._type !== "block") return ""
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = (block.children ?? []).map((child: any) => {
      const t = child.text ?? ""
      const marks: string[] = child.marks ?? []
      let out = t.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      if (marks.includes("strong")) out = `<strong>${out}</strong>`
      if (marks.includes("em")) out = `<em>${out}</em>`
      return out
    }).join("")
    switch (block.style) {
      case "h1": return `<h1>${text}</h1>`
      case "h2": return `<h2>${text}</h2>`
      case "h3": return `<h3>${text}</h3>`
      case "h4": return `<h4>${text}</h4>`
      case "blockquote": return `<blockquote>${text}</blockquote>`
      default: return text ? `<p>${text}</p>` : ""
    }
  }).join("\n")
}

const SITE_URL = getPublicSiteUrl()

/** Convert display date "Apr 09, 2026" → ISO "2026-04-09" for structured data. */
function toISODate(displayDate: string): string {
  const d = new Date(displayDate)
  if (Number.isNaN(d.getTime())) return displayDate
  return d.toISOString().slice(0, 10)
}

// Blog post data extracted to lib/blog-data.ts to reduce page bundle size.

// Get related posts data
interface RelatedPost {
  slug: string
  title: string
  image: string
  category: string
  date: string
}

function getRelatedPosts(slugs: string[]): RelatedPost[] {
  return slugs
    .map(slug => {
      const post = blogPosts[slug]
      if (!post) return null
      return {
        slug,
        title: post.title,
        image: post.image.replace('1200', '400').replace('600', '250'),
        category: post.category,
        date: post.date,
      }
    })
    .filter((post): post is RelatedPost => post !== null)
}

export async function generateStaticParams() {
  // Include both static slugs and Sanity CMS slugs
  const sanitySlugs = await getBlogSlugs().catch(() => [])
  const staticSlugs = Object.keys(blogPosts).map((slug) => ({ slug }))
  // Merge: static first, then any Sanity slugs not already in static
  return [
    ...staticSlugs,
    ...sanitySlugs.filter((s) => !staticSlugs.some((st) => st.slug === s.slug)),
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // Try Sanity first, fall back to static data
  const sanityPost = await getBlogPost(slug)
  const staticPost = blogPosts[slug]
  const sanityDate = sanityPost?.publishedAt
    ? new Date(sanityPost.publishedAt).toLocaleDateString("en-CA")
    : ""
  let post: { title: string; excerpt: string; image: string; date: string } | null
  if (sanityPost) {
    post = { title: sanityPost.title, excerpt: sanityPost.excerpt ?? "", image: sanityPost.coverImage ?? "/images/blog/1.png", date: sanityDate }
  } else if (staticPost) {
    post = { title: staticPost.title, excerpt: staticPost.excerpt, image: staticPost.image, date: staticPost.date }
  } else {
    post = null
  }

  if (!post) {
    return {
      title: "Post Not Found | Planet Motors Blog",
    }
  }

  return {
    title: `${post.title} | Planet Motors Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${slug}`,
      siteName: "Planet Motors",
      locale: "en_CA",
      type: "article",
      images: [{ url: post.image, width: 1200, height: 600, alt: post.title }],
      publishedTime: toISODate(post.date),
    },
  }
}

export default async function BlogPostPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params

  // Try Sanity CMS first; fall back to static blog-data.ts
  const sanityPost = await getBlogPost(slug)
  const staticPost = blogPosts[slug]

  if (!sanityPost && !staticPost) {
    notFound()
  }

  // Merge: prefer Sanity fields, fill gaps from static data
  const post = staticPost
    ? {
        ...staticPost,
        title: sanityPost?.title ?? staticPost.title,
        excerpt: sanityPost?.excerpt ?? staticPost.excerpt,
        image: sanityPost?.coverImage ?? staticPost.image,
        date: sanityPost?.publishedAt ? new Date(sanityPost.publishedAt).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "2-digit" }) : staticPost.date,
        content: staticPost.content, // full HTML content always from static (rich content)
        relatedPosts: staticPost.relatedPosts,
        readTime: staticPost.readTime,
        author: staticPost.author,
        category: staticPost.category,
      }
    : {
        title: sanityPost!.title ?? "",
        excerpt: sanityPost!.excerpt ?? "",
        image: sanityPost!.coverImage ?? "/images/blog/1.png",
        date: sanityPost!.publishedAt ? new Date(sanityPost!.publishedAt).toLocaleDateString("en-CA") : "",
        content: sanityPost!.body ? portableTextToHtml(sanityPost!.body) : `<p>${sanityPost!.excerpt ?? ""}</p>`,
        relatedPosts: [],
        readTime: "5 min read",
        author: "Planet Motors Team",
        category: "General",
      }

  const relatedPosts = getRelatedPosts(post.relatedPosts)

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }, { name: post.title, url: `/blog/${slug}` }]} />
      <ArticleJsonLd
        article={{
          title: post.title,
          slug,
          publishedAt: toISODate(post.date),
          excerpt: post.excerpt,
          coverImage: post.image,
          author: post.author,
        }}
      />
      <Header />

      <main id="main-content" tabIndex={-1} className="pt-24 pb-20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        {/* Back Link */}
        <div className="mx-auto max-w-4xl px-6 lg:px-8 py-4">
          <Link 
            href="/blog" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>

        {/* Hero Image */}
        <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px]">
          <Image
            src={post.image}
            alt={post.title}
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-16">
            <div className="mx-auto max-w-4xl">
              <Badge className="mb-4">{post.category}</Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.01em] lg:tracking-[-0.02em] text-white mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <span>{post.author}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <article className="mx-auto max-w-4xl px-6 lg:px-8 py-12">
          <div 
            className="prose prose-lg max-w-none prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content, {
              allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'video', 'source']),
              allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                a: ['href', 'name', 'target', 'rel', 'class'],
                img: ['src', 'alt', 'width', 'height', 'loading', 'class'],
                iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
                video: ['src', 'controls', 'width', 'height', 'poster'],
                source: ['src', 'type'],
                '*': ['class', 'id', 'style'],
              },
              transformTags: {
                // Ensure internal links open in same tab, external in new tab
                a: (tagName, attribs) => {
                  const href = attribs.href || ''
                  const isExternal = href.startsWith('http') && !href.includes('planetmotors')
                  return {
                    tagName,
                    attribs: {
                      ...attribs,
                      ...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
                    },
                  }
                },
              },
              allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
            }) }}
          />

          {/* Share Section */}
          <Separator className="my-12" />
          <BlogShareButtons
            title={post.title}
            url={`${getPublicSiteUrl()}/blog/${slug}`}
          />
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="bg-muted/30 py-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="group">
                    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                      <div className="aspect-video overflow-hidden relative">
                        <Image
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          fill
                          quality={80}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardContent className="p-6">
                        <Badge variant="outline" className="mb-3 text-xs">
                          {relatedPost.category}
                        </Badge>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {relatedPost.date}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Find Your Next Vehicle?</h2>
            <p className="text-muted-foreground mb-8">
              Browse our inventory of quality pre-owned vehicles or get a free trade-in appraisal today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/inventory">Browse Inventory</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/trade-in">Get Trade-In Value</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
