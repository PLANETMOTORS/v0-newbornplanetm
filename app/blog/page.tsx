import Link from "next/link"
import { Calendar, Clock, ArrowRight, Search, Tag } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Blog | Planet Motors - Car Buying Tips & Industry News",
  description: "Stay informed with Planet Motors blog. Expert advice on car buying, financing tips, EV trends, and automotive news for Canadian drivers.",
}

const featuredPost = {
  slug: "trade-in-vs-selling-car-ontario",
  title: "Trade-In vs Selling Your Car to a Dealer in Ontario",
  excerpt: "Discover the pros and cons of trading in versus selling your car privately. Learn which option gives you the best value and convenience when upgrading your vehicle.",
  date: "Feb 20, 2026",
  readTime: "8 min read",
  category: "Selling",
  image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=400&fit=crop",
}

const posts = [
  {
    slug: "tesla-full-self-driving-guide",
    title: "What Is Tesla Full Self-Driving (FSD)? Complete Buyer Guide",
    excerpt: "Everything you need to know about Tesla's Full Self-Driving capability, including features, pricing, and what to expect when purchasing a Tesla with FSD.",
    date: "Feb 10, 2026",
    readTime: "10 min read",
    category: "Electric Vehicles",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=250&fit=crop",
  },
  {
    slug: "biweekly-vs-monthly-payments-canada",
    title: "Bi-Weekly vs Monthly Car Payments in Canada: Which is Better?",
    excerpt: "Compare bi-weekly and monthly payment schedules to determine which option saves you more money and fits your budget best.",
    date: "Feb 02, 2026",
    readTime: "6 min read",
    category: "Financing",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop",
  },
  {
    slug: "tesla-model-y-vs-model-3",
    title: "Tesla Model Y vs Tesla Model 3: Which One Should You Buy?",
    excerpt: "A comprehensive comparison of Tesla's two most popular models. Discover the key differences in size, range, features, and value.",
    date: "Jan 26, 2026",
    readTime: "12 min read",
    category: "Electric Vehicles",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=250&fit=crop",
  },
  {
    slug: "awd-vs-rwd-ontario",
    title: "AWD vs RWD: Which Is Better to Drive in Ontario?",
    excerpt: "Understand the differences between all-wheel drive and rear-wheel drive, and which drivetrain is best for Ontario's varying weather conditions.",
    date: "Jan 09, 2026",
    readTime: "7 min read",
    category: "Buying Guide",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=250&fit=crop",
  },
  {
    slug: "we-buy-your-car-canada",
    title: "We Buy Your Car Across Canada",
    excerpt: "At Planet Motors, we buy your car anywhere in Canada, fast and hassle-free with no hidden fees. Get instant cash and turn your car into cash today!",
    date: "Oct 24, 2025",
    readTime: "5 min read",
    category: "Selling",
    image: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&h=250&fit=crop",
  },
  {
    slug: "sell-car-for-cash-canada",
    title: "Quick Guide: Sell Your Car for Cash In Canada",
    excerpt: "Sell your car for cash in Canada with confidence. Planet Motors offers fair prices, fast deals, and hassle-free paperwork.",
    date: "Sep 30, 2025",
    readTime: "6 min read",
    category: "Selling",
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=250&fit=crop",
  },
  {
    slug: "why-choose-planet-motors",
    title: "Why Choose Planet Motors?",
    excerpt: "Planet Motors offers used luxury cars and Teslas in Richmond Hill. Enjoy trusted service, transparent pricing, and flexible financing tailored to you.",
    date: "Sep 24, 2025",
    readTime: "5 min read",
    category: "Company",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=250&fit=crop",
  },
  {
    slug: "how-to-trade-in-used-car",
    title: "How to Trade in Your Used Car",
    excerpt: "Nearly 50% of Canadians choose to trade in their used cars when buying their next vehicle. It's a quick and hassle-free way to upgrade.",
    date: "Sep 03, 2025",
    readTime: "8 min read",
    category: "Trade-In",
    image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&h=250&fit=crop",
  },
  {
    slug: "car-resale-value-toronto",
    title: "Car Resale Value: How to Maximize it in Toronto",
    excerpt: "Discover proven tips to maximize your car's resale value. From regular maintenance and detailing to timing your sale.",
    date: "Aug 19, 2025",
    readTime: "9 min read",
    category: "Selling",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=250&fit=crop",
  },
  {
    slug: "tax-benefits-trade-in-vs-selling",
    title: "Tax Benefits of Trading In Your Car vs Selling Privately",
    excerpt: "Planet Motors explains the tax benefits of trading in your car vs selling it privately. Learn which option helps you save more.",
    date: "Aug 06, 2025",
    readTime: "7 min read",
    category: "Financing",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop",
  },
  {
    slug: "sell-financed-car-canada",
    title: "How to Sell a Financed Car in Canada?",
    excerpt: "Thinking of selling your financed car in Canada? Learn the step-by-step process, key legal requirements, and expert tips.",
    date: "Jul 17, 2025",
    readTime: "10 min read",
    category: "Selling",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=250&fit=crop",
  },
  {
    slug: "sell-car-toronto-guide",
    title: "How to Sell a Car in Toronto: A Comprehensive Guide",
    excerpt: "Looking to sell your car in Toronto? Discover the easiest way to get top dollar with Planet Motors.",
    date: "Jul 14, 2025",
    readTime: "12 min read",
    category: "Selling",
    image: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&h=250&fit=crop",
  },
]

const categories = [
  "All",
  "Electric Vehicles",
  "Financing",
  "Selling",
  "Trade-In",
  "Buying Guide",
  "Company",
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20">
        {/* Hero */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h1 className="font-serif text-4xl md:text-5xl font-semibold">
                Planet Motors Blog
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Expert advice on car buying, financing tips, EV trends, and automotive news for Canadian drivers.
              </p>
            </div>

            {/* Search & Categories */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search articles..." 
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {categories.map((category) => (
                <Button 
                  key={category} 
                  variant={category === "All" ? "default" : "outline"}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="font-semibold text-xl mb-6">Featured Article</h2>
            
            <Link href={`/blog/${featuredPost.slug}`} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video md:aspect-auto">
                    <img 
                      src={featuredPost.image} 
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-8 flex flex-col justify-center">
                    <Badge variant="secondary" className="w-fit mb-4">
                      {featuredPost.category}
                    </Badge>
                    <h3 className="font-serif text-2xl md:text-3xl font-semibold mb-4 group-hover:text-primary transition-colors">
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

        {/* All Posts */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="font-semibold text-xl mb-8">Latest Articles</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-3 text-xs">
                        {post.category}
                      </Badge>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Articles
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl font-semibold mb-4">
              Stay Updated
            </h2>
            <p className="text-muted-foreground mb-8">
              Subscribe to our newsletter for the latest car buying tips, industry news, and exclusive deals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1"
              />
              <Button>Subscribe</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              No spam, unsubscribe at any time.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
