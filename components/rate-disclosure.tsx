 
/**
 * RateDisclosure — OMVIC-compliant financing rate disclosure.
 *
 * Must render adjacent to any displayed rate on the site.
 * All values derive from lib/rates.ts RATE_FLOOR.
 *
 * Representative example:
 *   "O.A.C. Representative example: $35,000 financed at 6.29% APR
 *    over 84 months equals $510/month. Total cost of borrowing $7,840.
 *    Rates and terms subject to credit approval."
 */

import { RATE_FLOOR, RATE_FLOOR_DISPLAY } from "@/lib/rates"

/** Calculate monthly payment using standard amortization formula. */
function monthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const r = annualRate / 100 / 12
  if (r === 0) return principal / termMonths
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

interface RateDisclosureProps {
  /** Override the example principal (default $35,000). */
  principal?: number
  /** Override the term in months (default from lib/rates.ts). */
  termMonths?: number
  /** Additional CSS classes. */
  className?: string
  /** Render as compact (single-line) variant. */
  compact?: boolean
}

export function RateDisclosure({
  principal = 35_000,
  termMonths = 84,
  className = "",
  compact = false,
}: Readonly<RateDisclosureProps>) {
  const payment = monthlyPayment(principal, RATE_FLOOR, termMonths)
  const totalPaid = payment * termMonths
  const costOfBorrowing = totalPaid - principal

  const formattedPrincipal = `$${principal.toLocaleString("en-CA")}`
  const formattedPayment = `$${Math.round(payment).toLocaleString("en-CA")}`
  const formattedCost = `$${Math.round(costOfBorrowing).toLocaleString("en-CA")}`

  if (compact) {
    return (
      <p className={`text-xs text-muted-foreground ${className}`}>
        O.A.C. Example: {formattedPrincipal} at {RATE_FLOOR_DISPLAY} APR over{" "}
        {termMonths} months = {formattedPayment}/mo. Cost of borrowing{" "}
        {formattedCost}. Rates subject to credit approval.
      </p>
    )
  }

  return (
    <div className={`text-xs text-muted-foreground leading-relaxed ${className}`}>
      <p>
        O.A.C. Representative example: {formattedPrincipal} financed at{" "}
        {RATE_FLOOR_DISPLAY} APR over {termMonths} months equals{" "}
        {formattedPayment}/month. Total cost of borrowing {formattedCost}.
        Rates and terms subject to credit approval.
      </p>
    </div>
  )
}

/**
 * Inline rate text helper — use when you need "6.29%" as a string
 * that stays in sync with RATE_FLOOR.
 */
export function rateFromText(): string {
  return `Rates from ${RATE_FLOOR_DISPLAY}`
}
