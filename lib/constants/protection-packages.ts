/**
 * PlanetCare Protection Packages — F&I Tool
 *
 * Four-tier protection system inspired by Clutch.ca's model.
 * Used by: /protection-plans page, /checkout flow, Stripe checkout.
 */

export interface ProtectionPackage {
  id: string
  name: string
  /** Short label for checkout radio buttons */
  shortName: string
  /** Starting price — actual varies by vehicle */
  priceFrom: number
  /** Deposit due at checkout */
  deposit: number
  /** Who can buy this package */
  paymentMethod: "cash" | "finance" | "cash_and_finance"
  /** Warranty type */
  warranty: "none" | "standard" | "extended"
  /** Feature flags — used in the comparison table */
  features: {
    returnPolicy: boolean
    tradeInCredit: boolean
    detailing: boolean
    fullTankOfGas: boolean
    tireRimProtection: boolean
    rustProtection: boolean
    freeDelivery: boolean
    inspection: boolean
    safetyCertificate: boolean
  }
  /** Marketing description */
  description: string
  /** Is this the highlighted/recommended package? */
  highlighted: boolean
  /** Badge text (e.g. "Most Popular") */
  badge?: string
  /** Maximum coverage values for display */
  maxCoverage?: string
}

export const PROTECTION_PACKAGES: ProtectionPackage[] = [
  {
    id: "basic",
    name: "Basic",
    shortName: "No Protection",
    priceFrom: 0,
    deposit: 0,
    paymentMethod: "cash",
    warranty: "none",
    features: {
      returnPolicy: true,
      tradeInCredit: false,
      detailing: false,
      fullTankOfGas: false,
      tireRimProtection: false,
      rustProtection: false,
      freeDelivery: false,
      inspection: true,
      safetyCertificate: true,
    },
    description: "Cash purchase with no additional protection. Full payment due at checkout.",
    highlighted: false,
  },
  {
    id: "essential",
    name: "PlanetCare Essential",
    shortName: "Essential",
    priceFrom: 1950,
    deposit: 250,
    paymentMethod: "cash_and_finance",
    warranty: "standard",
    features: {
      returnPolicy: true,
      tradeInCredit: true,
      detailing: true,
      fullTankOfGas: true,
      tireRimProtection: false,
      rustProtection: false,
      freeDelivery: false,
      inspection: true,
      safetyCertificate: true,
    },
    description: "Standard warranty with trade-in credit. $100 refundable deposit at checkout.",
    highlighted: false,
  },
  {
    id: "certified",
    name: "PlanetCare Certified™",
    shortName: "Certified™",
    priceFrom: 3000,
    deposit: 250,
    paymentMethod: "cash_and_finance",
    warranty: "extended",
    features: {
      returnPolicy: true,
      tradeInCredit: true,
      detailing: true,
      fullTankOfGas: true,
      tireRimProtection: false,
      rustProtection: false,
      freeDelivery: true,
      inspection: true,
      safetyCertificate: true,
    },
    description: "Extended warranty with FREE delivery. Comprehensive mechanical coverage.",
    highlighted: true,
    badge: "Most Popular",
    maxCoverage: "$60K Replacement | ~$1M Life | ~$500K CI",
  },
  {
    id: "certified-plus",
    name: "PlanetCare Certified Plus™",
    shortName: "Certified Plus™",
    priceFrom: 4850,
    deposit: 250,
    paymentMethod: "finance",
    warranty: "extended",
    features: {
      returnPolicy: true,
      tradeInCredit: true,
      detailing: true,
      fullTankOfGas: true,
      tireRimProtection: true,
      rustProtection: true,
      freeDelivery: true,
      inspection: true,
      safetyCertificate: true,
    },
    description: "Everything included. Extended warranty, tire & rim, rust protection, and FREE delivery.",
    highlighted: false,
    badge: "Best Value",
    maxCoverage: "$60K Replacement | ~$1M Life | ~$500K CI | ~$25K Payments",
  },
]

/** Comparison table row definitions — order matches the PDF */
export const COMPARISON_ROWS = [
  { key: "paymentMethod", label: "Payment method accepted" },
  { key: "deposit", label: "Due at checkout" },
  { key: "returnPolicy", label: "10-day money back guarantee" },
  { key: "tradeInCredit", label: "Apply a trade-in credit" },
  { key: "warranty", label: "Warranty" },
  { key: "detailing", label: "Detailing" },
  { key: "fullTankOfGas", label: "Full tank of gas" },
  { key: "tireRimProtection", label: "Tire & rim protection" },
  { key: "rustProtection", label: "Rust protection" },
  { key: "freeDelivery", label: "Pickup/Delivery" },
  { key: "inspection", label: "Planet Motors Inspection" },
  { key: "safetyCertificate", label: "Safety standards certificate" },
] as const

export function getPackageById(id: string): ProtectionPackage | undefined {
  return PROTECTION_PACKAGES.find((p) => p.id === id)
}

export function getCheckoutPackages(): ProtectionPackage[] {
  return PROTECTION_PACKAGES
}
