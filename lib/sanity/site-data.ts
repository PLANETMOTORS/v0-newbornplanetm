// Planet Motors CMS - Site Data Helper v9
import { getSiteSettings, getNavigation } from "./fetch"

// Default site settings fallback
export const DEFAULT_SITE_SETTINGS = {
  dealerName: "Planet Motors",
  phone: "(905) 123-4567",
  email: "info@planetmotors.ca",
  streetAddress: "123 Auto Drive",
  city: "Mississauga",
  province: "ON",
  postalCode: "L5A 1A1",
  businessHours: [
    { day: "Monday - Friday", hours: "9:00 AM - 8:00 PM" },
    { day: "Saturday", hours: "9:00 AM - 6:00 PM" },
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
