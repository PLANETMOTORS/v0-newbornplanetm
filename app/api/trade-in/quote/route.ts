/**
 * POST /api/trade-in/quote
 *
 * Public endpoint that customers hit from the trade-in form.
 *
 *   1. CSRF: validate Origin / Referer
 *   2. Rate-limit by client IP
 *   3. Zod-parse + reject malformed input early
 *   4. Compute the value-range estimate (pure function)
 *   5. Persist to `trade_in_quotes` (Result-typed; failure ≠ thrown)
 *   6. Fan out side-effects: notification email, ADF, Meta CAPI
 *   7. Return the canonical success envelope
 *
 * Step 5 is the bug-fix from the original PR: until this insert was
 * added, every trade-in lead since launch was lost from the admin UI
 * even though the customer had received a confirmation email.
 *
 * The handler stays thin — every reusable piece (Zod schema, estimator,
 * repository) lives in `lib/trade-in/*` and is independently unit-tested.
 */

import { randomBytes } from "node:crypto"
import type { NextRequest } from "next/server"
import { sendNotificationEmail } from "@/lib/email"
import { validateOrigin } from "@/lib/csrf"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"
import { trackLead } from "@/lib/meta-capi-helpers"
import { rateLimit } from "@/lib/redis"
import { getClientIp } from "@/lib/security/client-ip"
import { tradeInToAdfProspect } from "@/lib/adf/adapters"
import { forwardLeadToAutoRaptor } from "@/lib/adf/forwarder"
import { logger } from "@/lib/logger"
import { estimateTradeInValue } from "@/lib/trade-in/estimator"
import { tradeInQuoteRequestSchema, type TradeInQuoteRequest } from "@/lib/trade-in/schemas"
import { persistTradeInQuote, type PersistError } from "@/lib/trade-in/repository"

const RATE_LIMIT_BUCKET = "trade-in-quote"
const RATE_LIMIT_HOURLY = 10
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60
const QUOTE_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000
const QUOTE_ID_RANDOM_BYTES = 3

function generateQuoteId(now: number): string {
  const suffix = randomBytes(QUOTE_ID_RANDOM_BYTES).toString("hex").toUpperCase()
  return `TQ-${now}-${suffix}`
}

function fireSideEffects(
  req: NextRequest,
  body: TradeInQuoteRequest,
  quoteId: string,
  estimate: ReturnType<typeof estimateTradeInValue>,
): void {
  if (body.customerEmail) {
    void sendNotificationEmail({
      type: "trade_in_quote",
      customerName: body.customerName ?? "Customer",
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      vehicleInfo: `${body.year} ${body.make} ${body.model}`,
      quoteId,
      tradeInValue: estimate.averageEstimate,
    }).catch((cause) =>
      logger.error("[trade-in] notification email failed", { quoteId, cause }),
    )
  }

  void forwardLeadToAutoRaptor(
    tradeInToAdfProspect({
      quoteId,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      vehicleYear: body.year,
      vehicleMake: body.make,
      vehicleModel: body.model,
      mileage: body.mileage,
      condition: body.condition,
      vin: body.vin,
      offerAmount: estimate.averageEstimate,
      offerLow: estimate.lowEstimate,
      offerHigh: estimate.highEstimate,
    }),
  ).catch((cause) =>
    logger.error("[trade-in] ADF forward failed", { quoteId, cause }),
  )

  trackLead(req, {
    email: body.customerEmail,
    phone: body.customerPhone,
    firstName: body.customerName,
    value: estimate.averageEstimate,
    contentName: `${body.year} ${body.make} ${body.model} Trade-In`,
    contentCategory: "trade_in",
  })
}

function persistWarningFor(error: PersistError | null): { _persistWarning: string } | Record<string, never> {
  if (!error) return {}
  return {
    _persistWarning: "Quote saved via email; database sync pending.",
  }
}

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return apiError(ErrorCode.FORBIDDEN, "Forbidden", 403)
  }

  const ip = getClientIp(req)
  const limiter = await rateLimit(`${RATE_LIMIT_BUCKET}:${ip}`, RATE_LIMIT_HOURLY, RATE_LIMIT_WINDOW_SECONDS)
  if (!limiter.success) {
    return apiError(ErrorCode.RATE_LIMITED, "Too many requests. Please try again later.", 429)
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return apiError(ErrorCode.VALIDATION_ERROR, "Body must be valid JSON", 400)
  }

  const parsed = tradeInQuoteRequestSchema.safeParse(raw)
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ")
    return apiError(ErrorCode.VALIDATION_ERROR, message, 400)
  }
  const body = parsed.data

  const now = Date.now()
  const quoteId = generateQuoteId(now)
  const validUntil = new Date(now + QUOTE_VALIDITY_MS).toISOString()

  const estimate = estimateTradeInValue({
    year: body.year,
    make: body.make,
    mileage: body.mileage,
    condition: body.condition,
    referenceYear: new Date(now).getUTCFullYear(),
  })

  const persistResult = await persistTradeInQuote({
    quoteId,
    vehicleYear: body.year,
    vehicleMake: body.make,
    vehicleModel: body.model,
    mileage: body.mileage,
    condition: body.condition,
    vin: body.vin ?? null,
    customerName: body.customerName ?? null,
    customerEmail: body.customerEmail ?? null,
    customerPhone: body.customerPhone ?? null,
    offerAmount: estimate.averageEstimate,
    offerLow: estimate.lowEstimate,
    offerHigh: estimate.highEstimate,
    status: "pending",
    validUntil,
    source: "instant_quote",
  })

  if (!persistResult.ok) {
    logger.error("[trade-in] persist failed", { quoteId, error: persistResult.error })
  }

  fireSideEffects(req, body, quoteId, estimate)

  return apiSuccess({
    quoteId,
    vehicle: {
      year: body.year,
      make: body.make,
      model: body.model,
      mileage: body.mileage,
      condition: body.condition,
      ...(body.vin ? { vin: body.vin } : {}),
    },
    estimate: {
      low: estimate.lowEstimate,
      high: estimate.highEstimate,
      average: estimate.averageEstimate,
      currency: "CAD" as const,
    },
    validUntil,
    message: "This is an estimated value. Final offer subject to in-person inspection.",
    ...persistWarningFor(persistResult.ok ? null : persistResult.error),
  })
}
