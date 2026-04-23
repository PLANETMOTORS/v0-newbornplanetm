/**
 * City data for local landing pages.
 *
 * Each city feeds into /sell-your-car/[city] and /sell-your-tesla/[city]
 * dynamic routes, providing localized SEO metadata, JSON-LD, and content.
 */

export interface CityData {
  slug: string
  name: string
  province: string
  /** Province abbreviation for display */
  provinceShort: string
  /** Approximate driving distance from Richmond Hill dealership */
  distanceKm: number
  /** Metro population for social proof */
  population: string
  /** City-specific keywords for sell-your-car pages */
  sellCarKeywords: string[]
  /** City-specific keywords for sell-your-tesla pages */
  sellTeslaKeywords: string[]
  /** Local landmarks / neighbourhoods for content */
  landmarks: string[]
  /** Whether this city has a sell-your-tesla landing page */
  hasTeslaPage: boolean
}

export const CITIES: Record<string, CityData> = {
  toronto: {
    slug: "toronto",
    name: "Toronto",
    province: "Ontario",
    provinceShort: "ON",
    distanceKm: 25,
    population: "2.9 million",
    sellCarKeywords: [
      "sell my car Toronto",
      "sell car Toronto",
      "cash for cars Toronto",
      "we buy cars Toronto",
      "sell used car Toronto",
      "car buyer Toronto",
      "sell vehicle Toronto GTA",
    ],
    sellTeslaKeywords: [
      "sell my Tesla Toronto",
      "sell Tesla Toronto",
      "Tesla buyer Toronto",
      "sell used Tesla Toronto GTA",
      "Tesla trade-in Toronto",
    ],
    landmarks: ["CN Tower", "Yorkville", "Scarborough", "North York", "Etobicoke"],
    hasTeslaPage: true,
  },
  mississauga: {
    slug: "mississauga",
    name: "Mississauga",
    province: "Ontario",
    provinceShort: "ON",
    distanceKm: 45,
    population: "720,000",
    sellCarKeywords: [
      "sell my car Mississauga",
      "sell car Mississauga",
      "cash for cars Mississauga",
      "we buy cars Mississauga",
      "sell used car Peel Region",
    ],
    sellTeslaKeywords: [],
    landmarks: ["Square One", "Port Credit", "Streetsville", "Erin Mills"],
    hasTeslaPage: false,
  },
  "richmond-hill": {
    slug: "richmond-hill",
    name: "Richmond Hill",
    province: "Ontario",
    provinceShort: "ON",
    distanceKm: 0,
    population: "210,000",
    sellCarKeywords: [
      "sell my car Richmond Hill",
      "sell car Richmond Hill",
      "cash for cars Richmond Hill",
      "car dealer Richmond Hill",
      "sell used car York Region",
    ],
    sellTeslaKeywords: [],
    landmarks: ["Hillcrest Mall", "Richmond Green", "Oak Ridges"],
    hasTeslaPage: false,
  },
  markham: {
    slug: "markham",
    name: "Markham",
    province: "Ontario",
    provinceShort: "ON",
    distanceKm: 15,
    population: "340,000",
    sellCarKeywords: [
      "sell my car Markham",
      "sell car Markham",
      "cash for cars Markham",
      "we buy cars Markham",
      "sell used car Markham Ontario",
    ],
    sellTeslaKeywords: [],
    landmarks: ["Markville Mall", "Unionville", "Pacific Mall"],
    hasTeslaPage: false,
  },
  vaughan: {
    slug: "vaughan",
    name: "Vaughan",
    province: "Ontario",
    provinceShort: "ON",
    distanceKm: 20,
    population: "325,000",
    sellCarKeywords: [
      "sell my car Vaughan",
      "sell car Vaughan",
      "cash for cars Vaughan",
      "we buy cars Vaughan",
      "sell used car Vaughan Ontario",
    ],
    sellTeslaKeywords: [],
    landmarks: ["Vaughan Mills", "Canada's Wonderland", "Woodbridge", "Kleinburg"],
    hasTeslaPage: false,
  },
  brampton: {
    slug: "brampton",
    name: "Brampton",
    province: "Ontario",
    provinceShort: "ON",
    distanceKm: 40,
    population: "660,000",
    sellCarKeywords: [
      "sell my car Brampton",
      "sell car Brampton",
      "cash for cars Brampton",
      "we buy cars Brampton",
      "sell used car Brampton Ontario",
    ],
    sellTeslaKeywords: [],
    landmarks: ["Bramalea City Centre", "Downtown Brampton", "Heart Lake"],
    hasTeslaPage: false,
  },
  vancouver: {
    slug: "vancouver",
    name: "Vancouver",
    province: "British Columbia",
    provinceShort: "BC",
    distanceKm: 4400,
    population: "2.6 million",
    sellCarKeywords: [
      "sell my car Vancouver",
      "sell car Vancouver",
      "cash for cars Vancouver",
      "we buy cars Vancouver BC",
      "sell used car Vancouver",
      "car buyer Vancouver",
    ],
    sellTeslaKeywords: [
      "sell my Tesla Vancouver",
      "sell Tesla Vancouver",
      "Tesla buyer Vancouver BC",
      "sell used Tesla Vancouver",
      "Tesla trade-in Vancouver",
    ],
    landmarks: ["Stanley Park", "Gastown", "Kitsilano", "Burnaby", "Surrey"],
    hasTeslaPage: true,
  },
  calgary: {
    slug: "calgary",
    name: "Calgary",
    province: "Alberta",
    provinceShort: "AB",
    distanceKm: 3400,
    population: "1.3 million",
    sellCarKeywords: [
      "sell my car Calgary",
      "sell car Calgary",
      "cash for cars Calgary",
      "we buy cars Calgary Alberta",
      "sell used car Calgary",
    ],
    sellTeslaKeywords: [],
    landmarks: ["Calgary Tower", "Stephen Avenue", "Kensington", "Beltline"],
    hasTeslaPage: false,
  },
  ottawa: {
    slug: "ottawa",
    name: "Ottawa",
    province: "Ontario",
    provinceShort: "ON",
    distanceKm: 450,
    population: "1 million",
    sellCarKeywords: [
      "sell my car Ottawa",
      "sell car Ottawa",
      "cash for cars Ottawa",
      "we buy cars Ottawa Ontario",
      "sell used car Ottawa",
    ],
    sellTeslaKeywords: [],
    landmarks: ["Parliament Hill", "ByWard Market", "Kanata", "Barrhaven"],
    hasTeslaPage: false,
  },
  edmonton: {
    slug: "edmonton",
    name: "Edmonton",
    province: "Alberta",
    provinceShort: "AB",
    distanceKm: 3700,
    population: "1 million",
    sellCarKeywords: [
      "sell my car Edmonton",
      "sell car Edmonton",
      "cash for cars Edmonton",
      "we buy cars Edmonton Alberta",
      "sell used car Edmonton",
    ],
    sellTeslaKeywords: [],
    landmarks: ["West Edmonton Mall", "Whyte Avenue", "Old Strathcona", "St. Albert"],
    hasTeslaPage: false,
  },
}

/** All city slugs for sell-your-car pages */
export const SELL_CAR_CITY_SLUGS = Object.keys(CITIES)

/** City slugs that have sell-your-tesla pages */
export const SELL_TESLA_CITY_SLUGS = Object.keys(CITIES).filter(
  (slug) => CITIES[slug].hasTeslaPage
)

/** Get city data by slug, returns undefined if not found */
export function getCityData(slug: string): CityData | undefined {
  return CITIES[slug]
}

/** Generate local FAQs for a city */
export function getLocalFAQs(city: CityData, type: "sell-car" | "sell-tesla") {
  const isTesla = type === "sell-tesla"
  const vehicleType = isTesla ? "Tesla" : "car"
  const isLocal = city.distanceKm <= 50

  return [
    {
      question: `How do I sell my ${vehicleType} in ${city.name}?`,
      answer: `Selling your ${vehicleType} in ${city.name} is easy with Planet Motors. Simply enter your vehicle details online for an instant valuation, schedule a ${isLocal ? "visit to our Richmond Hill location or a" : ""} free pickup, and receive same-day payment. We're OMVIC licensed since 2005.`,
    },
    {
      question: `Do you pick up cars in ${city.name} for free?`,
      answer: `Yes! Planet Motors offers free ${vehicleType} pickup across Canada, including ${city.name}${city.landmarks.length > 0 ? ` and surrounding areas like ${city.landmarks.slice(0, 2).join(" and ")}` : ""}. ${isLocal ? `We're only ${city.distanceKm}km away — you can also drive in for same-day payment.` : "Our nationwide logistics network ensures hassle-free pickup at your convenience."}`,
    },
    {
      question: `What ${vehicleType}s do you buy in ${city.name}?`,
      answer: isTesla
        ? "We buy all Tesla models — Model 3, Model Y, Model S, Model X, and Cybertruck. Any year, any condition. We use Aviloo battery diagnostics to offer fair, transparent pricing on every EV."
        : `We buy all makes and models in ${city.name} — sedans, SUVs, trucks, EVs, hybrids, and luxury vehicles. Any year, any mileage. Get your instant offer today.`,
    },
    {
      question: `How fast do I get paid after selling my ${vehicleType} in ${city.name}?`,
      answer: `Planet Motors pays same-day for vehicles in ${city.name}. ${isLocal ? "Visit our Richmond Hill dealership and leave with payment in hand." : "Once our team inspects your vehicle at pickup, payment is processed immediately — typically via e-transfer or bank draft."}`,
    },
    {
      question: `Why sell to Planet Motors instead of a private buyer in ${city.name}?`,
      answer: `Private sales in ${city.name} mean dealing with no-shows, lowballers, and safety risks. Planet Motors offers guaranteed pricing, same-day payment, no listing fees, free pickup, and we handle all OMVIC paperwork. We've been buying cars across Canada since 2005.`,
    },
  ]
}
