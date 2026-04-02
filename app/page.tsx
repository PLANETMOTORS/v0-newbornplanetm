// Planet Motors Homepage - Server Component with Sanity CMS Integration
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HomepageContent } from "@/components/homepage-content"
import { getSiteData } from "@/lib/sanity/site-data"
import { getTestimonials, getFaqs } from "@/lib/sanity/fetch"

export default async function HomePage() {
  // Fetch data from Sanity CMS
  const [siteData, testimonials, faqs] = await Promise.all([
    getSiteData(),
    getTestimonials(),
    getFaqs(),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HomepageContent 
        siteSettings={siteData.settings}
        testimonials={testimonials}
        faqs={faqs}
      />
      <Footer />
    </div>
  )
}
