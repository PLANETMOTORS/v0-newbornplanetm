/**
 * Zod schemas for the public trade-in quote endpoint.
 *
 * Every value crossing the network boundary is validated here. The handler
 * never touches `request.json()` directly — it consumes the parsed type.
 *
 * Validation rules are tightened to reject common API-fuzzing payloads:
 *   - year:    integer, [1900 .. currentYear + 1]
 *   - mileage: integer, [0 .. 1_500_000]
 *   - email:   RFC-ish + max length
 *   - phone:   permissive (digits + spaces + + - . ()), max 32 chars
 *   - VIN:     17-char [A-HJ-NPR-Z0-9] (no I, O, Q per ISO 3779)
 *
 * The output schema is exported so the route can produce a typed response.
 */

import { z } from "zod"
import { VEHICLE_CONDITIONS } from "./estimator"

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/
const PHONE_PATTERN = /^[+\d\s().-]{6,32}$/
const MAX_MILEAGE = 1_500_000
const MIN_YEAR = 1900
const MAX_FUTURE_YEAR_OFFSET = 1
const MAX_NAME_LEN = 200
const MAX_EMAIL_LEN = 254

/** Reference year at module load. The route can override per-request if needed. */
const CURRENT_YEAR = new Date().getUTCFullYear()

/**
 * Coerce string→number for numeric fields the FE may send as strings,
 * then validate as a finite integer in range. Rejects "abc", "12abc", NaN.
 */
const yearField = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "number" ? v : Number.parseInt(v, 10)))
  .pipe(
    z
      .number()
      .int("year must be an integer")
      .min(MIN_YEAR, `year must be ≥ ${MIN_YEAR}`)
      .max(CURRENT_YEAR + MAX_FUTURE_YEAR_OFFSET, "year cannot be in the far future"),
  )

const mileageField = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "number" ? v : Number.parseInt(v, 10)))
  .pipe(
    z
      .number()
      .int("mileage must be an integer")
      .min(0, "mileage cannot be negative")
      .max(MAX_MILEAGE, `mileage cannot exceed ${MAX_MILEAGE}`),
  )

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))

const vinField = z
  .string()
  .trim()
  .toUpperCase()
  .regex(VIN_PATTERN, "VIN must be 17 characters, no I/O/Q")
  .optional()

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(MAX_EMAIL_LEN)
  .email("invalid email")
  .optional()

const phoneField = z
  .string()
  .trim()
  .regex(PHONE_PATTERN, "invalid phone format")
  .optional()

export const tradeInQuoteRequestSchema = z
  .object({
    year: yearField,
    make: z.string().trim().min(1, "make is required").max(80),
    model: z.string().trim().min(1, "model is required").max(80),
    mileage: mileageField,
    condition: z.enum(VEHICLE_CONDITIONS),
    vin: vinField,
    customerName: optionalTrimmedString(MAX_NAME_LEN),
    customerEmail: emailField,
    customerPhone: phoneField,
  })
  .strict()

export type TradeInQuoteRequest = z.infer<typeof tradeInQuoteRequestSchema>

export const tradeInQuoteResponseDataSchema = z.object({
  quoteId: z.string(),
  vehicle: z.object({
    year: z.number().int(),
    make: z.string(),
    model: z.string(),
    mileage: z.number().int(),
    condition: z.enum(VEHICLE_CONDITIONS),
    vin: z.string().optional(),
  }),
  estimate: z.object({
    low: z.number().int(),
    high: z.number().int(),
    average: z.number().int(),
    currency: z.literal("CAD"),
  }),
  validUntil: z.string(),
  message: z.string(),
})

export type TradeInQuoteResponseData = z.infer<typeof tradeInQuoteResponseDataSchema>
