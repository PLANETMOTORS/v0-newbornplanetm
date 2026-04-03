// Planet Motors Footer - v19 - CMS Complete
import { FooterContent } from "@/components/footer-content"

// Default site settings - no external imports needed
const DEFAULT_SITE_SETTINGS = {
  dealerName: "Planet Motors",
  phone: "1-866-797-3332",
  email: "info@planetmotors.ca",
  streetAddress: "1234 Auto Drive",
  city: "Toronto",
  province: "ON",
  postalCode: "M1M 1M1",
}

export async function Footer() {
  return <FooterContent siteSettings={DEFAULT_SITE_SETTINGS} navigation={null} />
}
