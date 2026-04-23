// Planet Motors Footer - v19 - CMS Complete
import { FooterContent } from "@/components/footer-content"
import { PHONE_TOLL_FREE, EMAIL_INFO, DEALERSHIP_LOCATION } from "@/lib/constants/dealership"

// Default site settings - driven by centralized constants
const DEFAULT_SITE_SETTINGS = {
  dealerName: DEALERSHIP_LOCATION.name,
  phone: PHONE_TOLL_FREE,
  email: EMAIL_INFO,
  streetAddress: DEALERSHIP_LOCATION.streetAddress,
  city: DEALERSHIP_LOCATION.city,
  province: DEALERSHIP_LOCATION.province,
  postalCode: DEALERSHIP_LOCATION.postalCode,
  googleMapsUrl: "https://share.google/YAlbvyp4und6Nrka",
}

export function Footer() {
  return <FooterContent siteSettings={DEFAULT_SITE_SETTINGS} />
}
