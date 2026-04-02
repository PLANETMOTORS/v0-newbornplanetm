import { FooterContent } from "@/components/footer-content"
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

export async function Footer() {
  let settings = DEFAULT_SITE_SETTINGS

  try {
    const result = await sanityClient.fetch(`*[_type == "siteSettings"][0]`)
    if (result) settings = { ...DEFAULT_SITE_SETTINGS, ...result }
  } catch (error) {
    console.error("Footer: Failed to fetch site data:", error)
  }

  return <FooterContent siteSettings={settings} />
}
