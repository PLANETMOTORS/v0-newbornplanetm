// Planet Motors Footer - v19 - CMS Complete
import { FooterContent } from "@/components/footer-content"

// Default site settings - no external imports needed
const DEFAULT_SITE_SETTINGS = {
  dealerName: "Planet Motors",
  phone: "1-866-797-3332",
  email: "info@planetmotors.ca",
  streetAddress: "30 Major Mackenzie Dr E",
  city: "Richmond Hill",
  province: "ON",
  postalCode: "L4C 1G7",
  googleMapsUrl: "https://share.google/YAlbvyp4und6Nrka",
}

export async function Footer() {
  return <FooterContent siteSettings={DEFAULT_SITE_SETTINGS} />
}
