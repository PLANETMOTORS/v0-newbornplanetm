// Planet Motors Homepage - v7 2026-04-02 14:30
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HomepageContent } from "@/components/homepage-content"

// Default site settings - no external imports needed
const DEFAULT_SITE_SETTINGS = {
  dealerName: "Planet Motors",
  phone: "(416) 555-0123",
  email: "info@planetmotors.ca",
  streetAddress: "1234 Auto Drive",
  city: "Toronto",
  province: "ON",
  postalCode: "M1M 1M1",
}

export default async function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HomepageContent 
          siteSettings={DEFAULT_SITE_SETTINGS}
          testimonials={[]}
          faqs={[]}
        />
      </main>
      <Footer />
    </div>
  )
}
