import { BlogPageContent } from "@/components/blog-page-content"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"

export const metadata = {
  title: "Blog | Planet Motors - Car Buying Tips & Industry News",
  description:
    "Stay informed with Planet Motors blog. Expert advice on car buying, financing tips, EV trends, and automotive news for Canadian drivers.",
  alternates: {
    canonical: '/blog',
  },
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }]} />
      <Header />
      <BlogPageContent />
      <Footer />
    </div>
  )
}
