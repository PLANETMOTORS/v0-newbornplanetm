// Planet Motors - Site Data Helper
// Provides site settings with fallback defaults
import { getSiteSettings, getNavigation } from "./fetch"

// Default fallback data when Sanity is not populated
export const DEFAULT_SITE_SETTINGS = {
  siteName: "Planet Motors",
  tagline: "Ontario's Trusted Destination for Premium Pre-Owned Vehicles",
  phone: "(416) 555-0123",
  email: "info@planetmotors.ca",
  address: "123 Auto Drive, Toronto, ON M5V 1A1",
  socialLinks: [
    { platform: "facebook", url: "https://facebook.com/planetmotors" },
    { platform: "instagram", url: "https://instagram.com/planetmotors" },
    { platform: "twitter", url: "https://twitter.com/planetmotors" },
  ],
  logo: null,
}

const DEFAULT_NAVIGATION = [
  { _id: "nav-1", label: "Home", href: "/", order: 1 },
  { _id: "nav-2", label: "Inventory", href: "/inventory", order: 2 },
  { _id: "nav-3", label: "Sell Your Car", href: "/sell-your-car", order: 3 },
  { _id: "nav-4", label: "Financing", href: "/financing", order: 4 },
  { _id: "nav-5", label: "About", href: "/about", order: 5 },
  { _id: "nav-6", label: "Contact", href: "/contact", order: 6 },
]

export interface SiteData {
  settings: typeof DEFAULT_SITE_SETTINGS
  navigation: typeof DEFAULT_NAVIGATION
}

export async function getSiteData(): Promise<SiteData> {
  try {
    const [settings, navigation] = await Promise.all([
      getSiteSettings(),
      getNavigation(),
    ])

    return {
      settings: settings || DEFAULT_SITE_SETTINGS,
      navigation: navigation?.length > 0 ? navigation : DEFAULT_NAVIGATION,
    }
  } catch (error) {
    console.error("[v0] Failed to fetch site data:", error)
    return {
      settings: DEFAULT_SITE_SETTINGS,
      navigation: DEFAULT_NAVIGATION,
    }
  }
}
