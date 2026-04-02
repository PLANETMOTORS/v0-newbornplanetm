// Planet Motors Homepage - Server Component
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HomepageContent } from "@/components/homepage-content"
import { createClient } from "@sanity/client"

// Create Sanity client directly - no external imports
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "4588vjsz",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true,
})

// Default site settings when Sanity is empty
const DEFAULT_SITE_SETTINGS = {
  dealerName: "Planet Motors",
  phone: "(905) 123-4567",
  email: "info@planetmotors.ca",
  streetAddress: "123 Auto Drive",
  city: "Mississauga",
  province: "Ontario",
  postalCode: "L5N 1A1",
}

export default async function HomePage() {
  let settings = DEFAULT_SITE_SETTINGS
  let testimonials: any[] = []
  let faqs: any[] = []

  try {
    const [settingsResult, testimonialsResult, faqsResult] = await Promise.all([
      sanityClient.fetch(`*[_type == "siteSettings"][0]`),
      sanityClient.fetch(`*[_type == "testimonial"] | order(_createdAt desc)[0...6]`),
      sanityClient.fetch(`*[_type == "faqItem"] | order(order asc)`),
    ])
    
    if (settingsResult) settings = { ...DEFAULT_SITE_SETTINGS, ...settingsResult }
    if (testimonialsResult) testimonials = testimonialsResult
    if (faqsResult) faqs = faqsResult
  } catch (error) {
    console.error("Homepage: Failed to fetch CMS data:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HomepageContent 
        siteSettings={settings}
        testimonials={testimonials}
        faqs={faqs}
      />
      <Footer />
    </div>
  )
}
