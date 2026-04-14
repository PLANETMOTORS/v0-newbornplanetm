// Planet Motors Homepage - v20 - Memory Optimized
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HomepageContent } from "@/components/homepage-content"
import { getSiteSettings, getTestimonials, getFaqs } from "@/lib/sanity/fetch"

// Default site settings - fallback when CMS is unavailable
const DEFAULT_SITE_SETTINGS = {
  dealerName: "Planet Motors",
  phone: "1-866-797-3332",
  email: "info@planetmotors.ca",
  streetAddress: "1234 Auto Drive",
  city: "Toronto",
  province: "ON",
  postalCode: "M1M 1M1",
}

export default async function HomePage() {
  const [siteSettings, testimonials, faqs] = await Promise.all([
    getSiteSettings(),
    getTestimonials(),
    getFaqs(),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HomepageContent
          siteSettings={siteSettings ?? DEFAULT_SITE_SETTINGS}
          testimonials={testimonials ?? []}
          faqs={faqs ?? []}
        />
      </main>
      <Footer />
    </div>
  )
}
