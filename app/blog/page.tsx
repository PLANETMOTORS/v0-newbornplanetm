import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock } from "lucide-react"
import { BlogPageContent } from "@/components/blog-page-content"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { blogPostsMeta } from "@/lib/blog-data"

export const metadata = {
  title: "Blog | Planet Motors - Car Buying Tips & Industry News",
  description:
    "Stay informed with Planet Motors blog. Expert advice on car buying, financing tips, EV trends, and automotive news for Canadian drivers.",
  alternates: {
    canonical: '/blog',
  },
}

// Compute the featured (newest) post at build time — this is a Server Component
// so the featured image is in the initial HTML with a preload hint for fast LCP.
const featuredPost = [...blogPostsMeta]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }]} />
      <Header />

      <main id="main-content" tabIndex={-1} className="pt-24 pb-20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        {/* Hero — server-rendered for immediate paint */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.01em] md:tracking-[-0.02em]">
                Planet Motors Blog
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Expert advice on car buying, financing tips, EV trends, and automotive news for Canadian drivers.
              </p>
            </div>
          </div>
        </section>

        {/* Featured post — server-rendered with priority LCP image */}
        {featuredPost && (
          <section className="py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <h2 className="font-bold text-xl mb-6">Featured Article</h2>

              <Link href={`/blog/${featuredPost.slug}`} className="group">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-video md:aspect-auto relative">
                      <Image
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        fill
                        priority
                        quality={90}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-8 flex flex-col justify-center">
                      <Badge variant="secondary" className="w-fit mb-4">
                        {featuredPost.category}
                      </Badge>
                      <h3 className="text-2xl md:text-3xl font-semibold mb-4 group-hover:text-primary transition-colors">
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

        {/* Interactive search/filter + grid — client component */}
        <BlogPageContent featuredSlug={featuredPost?.slug} />
      </main>

      <Footer />
    </div>
  )
}
