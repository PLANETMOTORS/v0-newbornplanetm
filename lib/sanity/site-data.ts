// Planet Motors - Site Data v4 (cache bust)
import { getSiteSettings, getNavigation } from "./fetch"

// Default fallback data when Sanity is not populated
const DEFAULT_SITE_SETTINGS = {
  dealerName: "Planet Motors",
  phone: "1-866-797-3332",
  email: "info@planetmotors.ca",
  streetAddress: "30 Major Mackenzie DR EAST",
  city: "Richmond Hill",
  province: "ONTARIO",
  postalCode: "L4C 1G7",
  latitude: 43.8772,
  longitude: -79.4223,
  omvicNumber: "5482908",
  businessHours: [
    { day: "Monday", open: "9:00 am", close: "7:00 pm", isClosed: false },
    { day: "Tuesday", open: "9:00 am", close: "7:00 pm", isClosed: false },
    { day: "Wednesday", open: "9:00 am", close: "7:00 pm", isClosed: false },
    { day: "Thursday", open: "9:00 am", close: "7:00 pm", isClosed: false },
    { day: "Friday", open: "9:00 am", close: "7:00 pm", isClosed: false },
    { day: "Saturday", open: "9:00 am", close: "6:00 pm", isClosed: false },
    { day: "Sunday", open: "", close: "", isClosed: true },
  ],
  facebookUrl: "https://www.facebook.com/people/Planet-Motors/61553743141555/",
  instagramUrl: "https://www.instagram.com/planetmotors.ca/",
  twitterUrl: "https://x.com/PlanetMotors_ca",
  youtubeUrl: "https://www.youtube.com/@PlanetMotors_ca",
  googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1e2!3c!3d4287k!2s!2z!N!8!9!10!11!12m3!1m2!1s!2z!5e0!3m2!1sen!2sca!4v1!5m2!1sen!2sca",
  announcementBar: {
    showBar: true,
    message: "Canada-wide delivery - All credit financing + 100% online purchasing",
    linkUrl: "https://ev.planetmotors.ca/financingapplication?vehicleid=54067fsb-b305-418a-",
  },
  financingDefaults: {
    annualInterestRate: 6.29,
    amortizationMonths: 96,
  },
  deliveryConfiguration: {
    originPostalCode: "L4C 1G7",
    originLabel: "Richmond Hill, Ontario",
    maxDeliveryDistance: 5000,
    freeDeliveryRadius: 300,
  },
  aggregateRating: {
    ratingValue: 4.8,
    reviewCount: 277,
  },
  defaultSeo: {
    metaTitle: "Tesla SOH Battery Certificate",
    metaDescription: "Planet Motors is Richmond Hill's trusted used EV and PHEV dealership. Shop certified Teslas and electric vehicles with Arblo battery reports, all credit!",
  },
  depositAmount: 250,
}

const DEFAULT_NAVIGATION = {
  topBar: {
    showTopBar: true,
    phoneNumber: "1-866-797-3332",
    phoneDisplayText: "1-866-797-3332",
    address: "30 Major Mackenzie E, Richmond Hill, ON",
    addressLink: "https://maps.google.com/?q=30+Major+Mackenzie+E+Richmond+Hill+ON",
    trustBadges: [],
  },
  mainNavigation: [
    { 
      label: "Shop Inventory",
      href: "/inventory",
      submenu: [
        { label: "All Vehicles", href: "/inventory" },
        { label: "Electric Vehicles", href: "/inventory?fuelType=Electric" },
        { label: "SUVs & Crossovers", href: "/inventory?bodyType=SUV" },
        { label: "Sedans", href: "/inventory?bodyType=Sedan" },
        { label: "Trucks", href: "/inventory?bodyType=Truck" },
      ]
    },
    { label: "Sell or Trade", href: "/trade-in" },
    { 
      label: "Finance",
      href: "/financing",
      submenu: [
        { label: "Get Pre-Approved", href: "/financing" },
        { label: "Financing Calculator", href: "/financing#calculator" },
        { label: "How It Works", href: "/how-it-works" },
        { label: "Delivery", href: "/delivery" },
      ]
    },
    { 
      label: "More",
      href: "/about",
      submenu: [
        { label: "About", href: "/about" },
        { label: "Car Value Calculator", href: "/trade-in" },
        { label: "Protection Plans", href: "/protection-plans" },
        { label: "FAQ", href: "/faq" },
        { label: "Careers", href: "/careers" },
        { label: "Contact Us", href: "/contact" },
        { label: "Blog", href: "/blog" },
      ]
    },
    { label: "EV Battery", href: "/ev-battery-health" },
  ],
  headerCta: {
    showCta: true,
    buttonLabel: "Get Pre-Approved",
    buttonUrl: "/financing",
    buttonStyle: "primary",
  },
  footerLinkColumns: [],
  footerBottom: {
    copyrightText: "© 2026 Planet Motors. All rights reserved.",
    legalLinks: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
}

export type SiteData = {
  settings: typeof DEFAULT_SITE_SETTINGS
  navigation: typeof DEFAULT_NAVIGATION
}

/**
 * Fetches site data from Sanity with fallback to defaults
 * This should be called from server components
 */
export async function getSiteData(): Promise<SiteData> {
  try {
    const [sanitySettings, sanityNavigation] = await Promise.all([
      getSiteSettings(),
      getNavigation(),
    ])

    // Merge Sanity data with defaults (Sanity data takes precedence)
    const settings = sanitySettings 
      ? { ...DEFAULT_SITE_SETTINGS, ...sanitySettings }
      : DEFAULT_SITE_SETTINGS

    const navigation = sanityNavigation
      ? { ...DEFAULT_NAVIGATION, ...sanityNavigation }
      : DEFAULT_NAVIGATION

    return { settings, navigation }
  } catch (error) {
    console.error("Failed to fetch site data from Sanity:", error)
    return {
      settings: DEFAULT_SITE_SETTINGS,
      navigation: DEFAULT_NAVIGATION,
    }
  }
}

export { DEFAULT_SITE_SETTINGS, DEFAULT_NAVIGATION }
