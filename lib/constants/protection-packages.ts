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
    description: "Standard warranty with trade-in credit. $250 refundable deposit at checkout.",
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
    description: "Extended warranty with FREE delivery. Full mechanical coverage.",
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

/** Valid keys for comparison table rows */
type ComparisonRowKey =
  | "paymentMethod"
  | "deposit"
  | "warranty"
  | keyof ProtectionPackage["features"]

/** Comparison table row definitions — order matches the PDF */
export const COMPARISON_ROWS: ReadonlyArray<{ key: ComparisonRowKey; label: string }> = [
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
]

export function getPackageById(id: string): ProtectionPackage | undefined {
  return PROTECTION_PACKAGES.find((p) => p.id === id)
}

export function getCheckoutPackages(): ProtectionPackage[] {
  return PROTECTION_PACKAGES
}

/* ─── Checkout-friendly format ─── */
export interface CheckoutPlan {
  id: string
  name: string
  price: number
  description: string
  badge?: string
  features: string[]
  deposit: number
  highlighted: boolean
}

/** Feature-flag keys → human-readable labels (checkout card list) */
const FEATURE_LABELS: Record<keyof ProtectionPackage["features"], string> = {
  returnPolicy: "10-day money-back guarantee",
  tradeInCredit: "Trade-in credit eligible",
  detailing: "Full detailing included",
  fullTankOfGas: "Full tank of gas",
  tireRimProtection: "Tire & rim protection",
  rustProtection: "Rust protection",
  freeDelivery: "FREE delivery",
  inspection: "Planet Motors inspection",
  safetyCertificate: "Safety standards certificate",
}

function warrantyLabel(w: ProtectionPackage["warranty"]): string | null {
  switch (w) {
    case "standard": return "Standard warranty"
    case "extended": return "Extended warranty"
    default: return null
  }
}

/**
 * Converts PROTECTION_PACKAGES into checkout-ready plan objects.
 * Used by checkout page, vehicle-checkout component, and protection-plan-selector.
 */
export const CHECKOUT_PLANS: CheckoutPlan[] = PROTECTION_PACKAGES.map((pkg) => {
  const featureList: string[] = []
  const wl = warrantyLabel(pkg.warranty)
  if (wl !== null) featureList.push(wl)
  for (const key of Object.keys(pkg.features) as Array<keyof ProtectionPackage["features"]>) {
    if (pkg.features[key] === true) {
      featureList.push(FEATURE_LABELS[key])
    }
  }
  return {
    id: pkg.id,
    name: pkg.name,
    price: pkg.priceFrom,
    description: pkg.description,
    badge: pkg.badge,
    features: featureList,
    deposit: pkg.deposit,
    highlighted: pkg.highlighted,
  }
})
