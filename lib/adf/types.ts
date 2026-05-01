/**
 * Auto-Lead Data Format (ADF) — STAR XML schema types.
 *
 * Reference: STAR / OEM Adoption (https://www.starstandard.org/)
 * AutoRaptor docs: https://help.autoraptor.com/category/adf-leads
 *
 * The ADF XML envelope wraps a single <prospect> per lead. AutoRaptor
 * (and most CRMs) accept ADF as the email *body* — they parse the
 * XML, ignore non-XML text, and create a contact record.
 *
 * We model only the elements we actually populate. AutoRaptor is
 * tolerant of missing optional elements — the spec requires
 * <prospect>, <requestdate>, <vendor>, <provider> at minimum.
 *
 * Reported by Toni Sultzberg as a launch-blocker — every lead
 * the website captures must arrive in AutoRaptor or the dealer
 * sales team won't work it.
 */

export type LeadInterest =
  | "buy"
  | "lease"
  | "trade-in"
  | "service"
  | "test-drive"
  | "general"

export type LeadStatus = "new" | "used" | "certified"

export interface ADFContact {
  firstName?: string
  lastName?: string
  fullName?: string
  email?: string
  phone?: string
}

export interface ADFVehicle {
  year?: number
  make?: string
  model?: string
  trim?: string
  vin?: string
  stockNumber?: string
  mileage?: number
  /** "buy" for sales lead, "trade-in" for trade-in lead, etc */
  interest: LeadInterest
  /** New / Used / Certified */
  status?: LeadStatus
  price?: number
}

export interface ADFTradeIn {
  year?: number
  make?: string
  model?: string
  trim?: string
  vin?: string
  mileage?: number
  condition?: string
  /** Estimated trade-in offer (CAD) */
  offerAmount?: number
}

export interface ADFFinanceDetails {
  /** Monthly budget the customer can afford (CAD) */
  monthlyBudget?: number
  /** Down payment amount (CAD) */
  downPayment?: number
  /** Annual income (CAD) */
  annualIncome?: number
  /** Employment status */
  employmentStatus?: string
}

export interface ADFProspect {
  /**
   * Unique source ID for this lead. Use the quote/application ID so
   * AutoRaptor can dedupe if we re-send (e.g. retry on transient failure).
   */
  id: string
  /** ISO 8601 timestamp of when the lead was captured */
  requestDate: string
  /** Free-text comments / notes — appended at end of <prospect> */
  comments?: string
  customer: ADFContact
  vehicle?: ADFVehicle
  tradeIn?: ADFTradeIn
  finance?: ADFFinanceDetails
  /**
   * Lead source label (e.g. "Trade-In Quote", "Finance Application",
   * "Vehicle Inquiry"). Mapped into <provider><service>.
   */
  source: string
}
