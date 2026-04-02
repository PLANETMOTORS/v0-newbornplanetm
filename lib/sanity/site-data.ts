import { getSiteSettings, getNavigation } from "./fetch"

export const DEFAULT_SITE_SETTINGS = {
  dealerName: "Planet Motors",
  phone: "(905) 761-2700",
  email: "info@planetmotors.ca",
  streetAddress: "8505 Keele St Unit 1",
  city: "Concord",
  province: "ON",
  postalCode: "L4K 3P4",
  socialLinks: [
    { platform: "facebook", url: "https://facebook.com/planetmotors" },
    { platform: "instagram", url: "https://instagram.com/planetmotors" },
  ],
  businessHours: [
    { day: "Monday", open: "9:00 AM", close: "7:00 PM", closed: false },
    { day: "Tuesday", open: "9:00 AM", close: "7:00 PM", closed: false },
    { day: "Wednesday", open: "9:00 AM", close: "7:00 PM", closed: false },
    { day: "Thursday", open: "9:00 AM", close: "7:00 PM", closed: false },
    { day: "Friday", open: "9:00 AM", close: "6:00 PM", closed: false },
    { day: "Saturday", open: "10:00 AM", close: "5:00 PM", closed: false },
    { day: "Sunday", open: "", close: "", closed: true },
  ],
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
      navigation:
        navigation?.mainNavigation && navigation.mainNavigation.length > 0
          ? navigation.mainNavigation
          : DEFAULT_NAVIGATION,
    }
  } catch {
    return {
      settings: DEFAULT_SITE_SETTINGS,
      navigation: DEFAULT_NAVIGATION,
    }
  }
}
