// Planet Motors CMS - Site Data Helper v18
import { getSiteSettings, getNavigation } from "./fetch"
import { WEEKDAY_HOURS_LONG, SATURDAY_HOURS_LONG, DEALERSHIP_LOCATION, PHONE_TOLL_FREE, EMAIL_INFO } from "@/lib/constants/dealership"

// Default site settings fallback
export const DEFAULT_SITE_SETTINGS = {
  dealerName: "Planet Motors",
  phone: PHONE_TOLL_FREE,
  email: EMAIL_INFO,
  streetAddress: DEALERSHIP_LOCATION.streetAddress,
  city: DEALERSHIP_LOCATION.city,
  province: DEALERSHIP_LOCATION.province,
  postalCode: DEALERSHIP_LOCATION.postalCode,
  businessHours: [
    { day: "Monday - Friday", hours: WEEKDAY_HOURS_LONG },
    { day: "Saturday", hours: SATURDAY_HOURS_LONG },
    { day: "Sunday", hours: "Closed" },
  ],
  facebookUrl: "https://facebook.com/planetmotors",
  instagramUrl: "https://instagram.com/planetmotors",
  twitterUrl: "",
  youtubeUrl: "",
}

// Default navigation fallback
export const DEFAULT_NAVIGATION = {
  mainNavigation: [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Financing", href: "/financing" },
    { label: "Sell Your Car", href: "/sell-your-car" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  footerLinkColumns: [],
}

// Get site data with fallback defaults
export async function getSiteData() {
  try {
    const [settings, navigation] = await Promise.all([
      getSiteSettings(),
      getNavigation(),
    ])
    return {
      settings: settings || DEFAULT_SITE_SETTINGS,
      navigation: navigation || DEFAULT_NAVIGATION,
    }
  } catch (error) {
    console.error("[v0] Error fetching site data:", error)
    return {
      settings: DEFAULT_SITE_SETTINGS,
      navigation: DEFAULT_NAVIGATION,
    }
  }
}
