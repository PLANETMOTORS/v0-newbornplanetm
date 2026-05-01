/**
 * Zod schemas for the public capture-lead endpoint.
 *
 * Used by both the Next.js route handler at
 * `/api/v1/financing/capture-lead` and any other surface that needs
 * to validate the same payload (e.g. background reprocessing).
 *
 * Every field crossing the network boundary is validated here so the
 * handler never operates on `unknown`.
 */

import { z } from "zod"

const EMAIL_MAX_LEN = 254
const NAME_MAX_LEN = 200
const PHONE_PATTERN = /^[+\d\s().-]{6,32}$/

/** Coerce string→number, then validate as a finite positive value. */
const positiveNumber = (label: string) =>
  z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "number" ? v : Number(v)))
    .pipe(
      z
        .number()
        .finite(`${label} must be a finite number`)
        .positive(`${label} must be > 0`),
    )

/** Coerce string→number, then validate as a positive integer. */
const positiveInteger = (label: string) =>
  z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "number" ? v : Number(v)))
    .pipe(
      z
        .number()
        .int(`${label} must be a whole number`)
        .positive(`${label} must be > 0`),
    )

const trimmedName = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(NAME_MAX_LEN, `${label} is too long`)

export const captureLeadRequestSchema = z
  .object({
    firstName: trimmedName("firstName"),
    lastName: trimmedName("lastName"),
    email: z
      .string({ required_error: "email is required" })
      .trim()
      .toLowerCase()
      .max(EMAIL_MAX_LEN)
      .email("invalid email"),
    phone: z
      .string({ required_error: "phone is required" })
      .trim()
      .regex(PHONE_PATTERN, "invalid phone format"),
    annualIncome: positiveNumber("annualIncome"),
    requestedAmount: positiveNumber("requestedAmount"),
    requestedTerm: positiveInteger("requestedTerm"),
  })
  .strict()

export type CaptureLeadRequest = z.infer<typeof captureLeadRequestSchema>

export const PERSIST_ERROR_CODE = "LEAD_PERSIST_FAILED" as const
export const RETRY_PHONE = "(416) 555-0100" as const
