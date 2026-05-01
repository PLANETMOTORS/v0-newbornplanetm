/**
 * ADF prospect adapters — convert internal lead-shape into the
 * structured ADFProspect that the XML generator consumes.
 *
 * One adapter per lead type the website captures:
 *   - Trade-in quote      (POST /api/trade-in/quote)
 *   - Finance application (POST /api/finance/apply)
 *   - Reservation deposit (POST /api/reservations)
 *   - Vehicle inquiry     (POST /api/contact)
 *   - Test drive request  (POST /api/test-drive)
 *
 * Adapters are pure functions: input lead-shape → ADFProspect.
 * No side-effects, fully unit-testable, no DB calls.
 */

import type {
  ADFContact,
  ADFProspect,
  ADFVehicle,
  ADFTradeIn,
} from "./types"

function splitName(fullName: string | null | undefined): {
  firstName?: string
  lastName?: string
} {
  if (!fullName) return {}
  const trimmed = fullName.trim()
  if (!trimmed) return {}
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}

function buildContact(input: {
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
}): ADFContact {
  const { firstName, lastName } = splitName(input.customerName)
  const contact: ADFContact = {}
  if (firstName) contact.firstName = firstName
  if (lastName) contact.lastName = lastName
  if (input.customerEmail) contact.email = input.customerEmail
  if (input.customerPhone) contact.phone = input.customerPhone
  return contact
}

// ── Trade-in adapter ───────────────────────────────────────────────

export interface TradeInLeadInput {
  quoteId: string
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  vehicleYear: number
  vehicleMake: string
  vehicleModel: string
  vehicleTrim?: string | null
  mileage?: number | null
  condition?: string | null
  vin?: string | null
  offerAmount?: number | null
  offerLow?: number | null
  offerHigh?: number | null
  /** ISO 8601, defaults to "now" */
  createdAt?: string
}

export function tradeInToAdfProspect(input: TradeInLeadInput): ADFProspect {
  const tradeIn: ADFTradeIn = {
    year: input.vehicleYear,
    make: input.vehicleMake,
    model: input.vehicleModel,
    trim: input.vehicleTrim ?? undefined,
    vin: input.vin ?? undefined,
    mileage: input.mileage ?? undefined,
    condition: input.condition ?? undefined,
    offerAmount: input.offerAmount ?? undefined,
  }
  const offerNote =
    input.offerLow !== undefined &&
    input.offerLow !== null &&
    input.offerHigh !== undefined &&
    input.offerHigh !== null
      ? `Estimate range: $${input.offerLow.toLocaleString()} – $${input.offerHigh.toLocaleString()} CAD`
      : undefined

  return {
    id: input.quoteId,
    requestDate: input.createdAt ?? new Date().toISOString(),
    customer: buildContact(input),
    tradeIn,
    source: "Trade-In Quote",
    comments: offerNote,
  }
}

// ── Finance application adapter ────────────────────────────────────

export interface FinanceLeadInput {
  applicationId: string
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  /** Vehicle of interest (the car they want to finance) */
  vehicleYear?: number | null
  vehicleMake?: string | null
  vehicleModel?: string | null
  vehicleTrim?: string | null
  vin?: string | null
  stockNumber?: string | null
  vehiclePrice?: number | null
  vehicleStatus?: "new" | "used" | "certified"
  monthlyBudget?: number | null
  downPayment?: number | null
  annualIncome?: number | null
  employmentStatus?: string | null
  notes?: string | null
  createdAt?: string
}

export function financeToAdfProspect(input: FinanceLeadInput): ADFProspect {
  const vehicle: ADFVehicle | undefined = input.vehicleMake
    ? {
        interest: "buy",
        status: input.vehicleStatus ?? "used",
        year: input.vehicleYear ?? undefined,
        make: input.vehicleMake,
        model: input.vehicleModel ?? undefined,
        trim: input.vehicleTrim ?? undefined,
        vin: input.vin ?? undefined,
        stockNumber: input.stockNumber ?? undefined,
        price: input.vehiclePrice ?? undefined,
      }
    : undefined

  return {
    id: input.applicationId,
    requestDate: input.createdAt ?? new Date().toISOString(),
    customer: buildContact(input),
    vehicle,
    finance: {
      monthlyBudget: input.monthlyBudget ?? undefined,
      downPayment: input.downPayment ?? undefined,
      annualIncome: input.annualIncome ?? undefined,
      employmentStatus: input.employmentStatus ?? undefined,
    },
    source: "Finance Application",
    comments: input.notes ?? undefined,
  }
}

// ── Reservation adapter ────────────────────────────────────────────

export interface ReservationLeadInput {
  reservationId: string
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  vehicleYear?: number | null
  vehicleMake?: string | null
  vehicleModel?: string | null
  vehicleTrim?: string | null
  vin?: string | null
  stockNumber?: string | null
  vehiclePrice?: number | null
  depositAmount?: number | null
  createdAt?: string
}

export function reservationToAdfProspect(input: ReservationLeadInput): ADFProspect {
  const vehicle: ADFVehicle | undefined = input.vehicleMake
    ? {
        interest: "buy",
        status: "used",
        year: input.vehicleYear ?? undefined,
        make: input.vehicleMake,
        model: input.vehicleModel ?? undefined,
        trim: input.vehicleTrim ?? undefined,
        vin: input.vin ?? undefined,
        stockNumber: input.stockNumber ?? undefined,
        price: input.vehiclePrice ?? undefined,
      }
    : undefined

  const depositNote =
    input.depositAmount !== undefined && input.depositAmount !== null
      ? `Reservation deposit: $${input.depositAmount.toLocaleString()} CAD`
      : undefined

  return {
    id: input.reservationId,
    requestDate: input.createdAt ?? new Date().toISOString(),
    customer: buildContact(input),
    vehicle,
    source: "Reservation Deposit",
    comments: depositNote,
  }
}

// ── Vehicle inquiry / contact form adapter ─────────────────────────

export interface InquiryLeadInput {
  inquiryId: string
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  vehicleYear?: number | null
  vehicleMake?: string | null
  vehicleModel?: string | null
  vehicleTrim?: string | null
  vin?: string | null
  stockNumber?: string | null
  message?: string | null
  createdAt?: string
}

export function inquiryToAdfProspect(input: InquiryLeadInput): ADFProspect {
  const vehicle: ADFVehicle | undefined = input.vehicleMake
    ? {
        interest: "buy",
        status: "used",
        year: input.vehicleYear ?? undefined,
        make: input.vehicleMake,
        model: input.vehicleModel ?? undefined,
        trim: input.vehicleTrim ?? undefined,
        vin: input.vin ?? undefined,
        stockNumber: input.stockNumber ?? undefined,
      }
    : undefined

  return {
    id: input.inquiryId,
    requestDate: input.createdAt ?? new Date().toISOString(),
    customer: buildContact(input),
    vehicle,
    source: "Vehicle Inquiry",
    comments: input.message ?? undefined,
  }
}

// ── Test drive adapter ─────────────────────────────────────────────

export interface TestDriveLeadInput {
  testDriveId: string
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  vehicleYear?: number | null
  vehicleMake?: string | null
  vehicleModel?: string | null
  vehicleTrim?: string | null
  vin?: string | null
  stockNumber?: string | null
  preferredDate?: string | null
  preferredTime?: string | null
  createdAt?: string
}

export function testDriveToAdfProspect(input: TestDriveLeadInput): ADFProspect {
  const vehicle: ADFVehicle | undefined = input.vehicleMake
    ? {
        interest: "test-drive",
        status: "used",
        year: input.vehicleYear ?? undefined,
        make: input.vehicleMake,
        model: input.vehicleModel ?? undefined,
        trim: input.vehicleTrim ?? undefined,
        vin: input.vin ?? undefined,
        stockNumber: input.stockNumber ?? undefined,
      }
    : undefined

  const dateNote =
    input.preferredDate || input.preferredTime
      ? `Preferred: ${[input.preferredDate, input.preferredTime].filter(Boolean).join(" ")}`
      : undefined

  return {
    id: input.testDriveId,
    requestDate: input.createdAt ?? new Date().toISOString(),
    customer: buildContact(input),
    vehicle,
    source: "Test Drive Request",
    comments: dateNote,
  }
}
