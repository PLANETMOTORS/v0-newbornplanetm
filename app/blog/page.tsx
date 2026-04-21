import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlogPageContent } from "@/components/blog-page-content"

export const metadata = {
  title: "Blog | Planet Motors - Car Buying Tips & Industry News",
  description:
    "Stay informed with Planet Motors blog. Expert advice on car buying, financing tips, EV trends, and automotive news for Canadian drivers.",
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BlogPageContent />
      <Footer />
    </div>
  )
}
