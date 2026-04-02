// Planet Motors Footer - v14
import { FooterContent } from "@/components/footer-content"

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

export async function Footer() {
  return <FooterContent siteSettings={DEFAULT_SITE_SETTINGS} navigation={null} />
}
