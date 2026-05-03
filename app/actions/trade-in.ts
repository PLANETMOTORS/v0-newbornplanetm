'use server'

/**
 * Server Action: submit a trade-in quote request.
 *
 * Replaces the client-side `fetch('/api/trade-in/quote')` call.
 * Next.js Server Actions have built-in CSRF protection (same-origin),
 * so we skip the manual Origin/Referer check.
 *
 * Returns a discriminated-union state consumed by `useActionState`.
 */

import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { sendNotificationEmail } from '@/lib/email'
import { trackLead } from '@/lib/meta-capi-helpers'
import { rateLimit } from '@/lib/redis'
import { tradeInToAdfProspect } from '@/lib/adf/adapters'
import { forwardLeadToAutoRaptor } from '@/lib/adf/forwarder'
import { logger } from '@/lib/logger'
import { estimateTradeInValue } from '@/lib/trade-in/estimator'
import { tradeInQuoteRequestSchema } from '@/lib/trade-in/schemas'
import { persistTradeInQuote } from '@/lib/trade-in/repository'
import { PHONE_LOCAL } from '@/lib/constants/dealership'

// ── Types ───────────────────────────────────────────────────────────────

export type TradeInFormState =
  | { status: 'idle' }
  | { status: 'success'; quoteId: string }
  | { status: 'error'; message: string }

// ── Constants ───────────────────────────────────────────────────────────

const RATE_LIMIT_BUCKET = 'trade-in-quote'
const RATE_LIMIT_HOURLY = 10
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60
const QUOTE_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000
const QUOTE_ID_RANDOM_BYTES = 3

function generateQuoteId(now: number): string {
  const suffix = randomBytes(QUOTE_ID_RANDOM_BYTES).toString('hex').toUpperCase()
  return `TQ-${now}-${suffix}`
}

async function getClientIpFromHeaders(): Promise<string> {
  const h = await headers()
  return (
    h.get('cf-connecting-ip')?.trim().toLowerCase() ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim().toLowerCase() ||
    h.get('x-real-ip')?.trim().toLowerCase() ||
    'unknown'
  )
}

// ── Action ──────────────────────────────────────────────────────────────

export async function submitTradeInQuote(
  _prev: TradeInFormState,
  formData: FormData,
): Promise<TradeInFormState> {
  // 1. Rate-limit by IP
  const ip = await getClientIpFromHeaders()
  const limiter = await rateLimit(
    `${RATE_LIMIT_BUCKET}:${ip}`,
    RATE_LIMIT_HOURLY,
    RATE_LIMIT_WINDOW_SECONDS,
  )
  if (!limiter.success) {
    return { status: 'error', message: 'Too many requests. Please try again later.' }
  }

  // 2. Parse + validate with Zod
  const raw = {
    year: formData.get('year'),
    make: formData.get('make'),
    model: formData.get('model'),
    mileage: formData.get('mileage'),
    condition: formData.get('condition'),
    customerName: formData.get('name') || undefined,
    customerEmail: formData.get('email') || undefined,
    customerPhone: formData.get('phone') || undefined,
  }

  const parsed = tradeInQuoteRequestSchema.safeParse(raw)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('. ')
    return { status: 'error', message }
  }
  const body = parsed.data

  // 3. Generate quote
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

  // 4. Persist to DB
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
    status: 'pending',
    validUntil,
    source: 'instant_quote',
  })
  if (!persistResult.ok) {
    logger.error('[trade-in] persist failed', { quoteId, error: persistResult.error })
  }

  // 5. Fire-and-forget side-effects
  fireSideEffects(body, quoteId, estimate)

  return { status: 'success', quoteId }
}

// ── Side-effects (fire-and-forget) ──────────────────────────────────────

function fireSideEffects(
  body: { year: number; make: string; model: string; mileage: number; condition: string; customerName?: string; customerEmail?: string; customerPhone?: string },
  quoteId: string,
  estimate: ReturnType<typeof estimateTradeInValue>,
): void {
  try {
    if (body.customerEmail) {
      void sendNotificationEmail({
        type: 'trade_in_quote',
        customerName: body.customerName ?? 'Customer',
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        vehicleInfo: `${body.year} ${body.make} ${body.model}`,
        quoteId,
        tradeInValue: estimate.averageEstimate,
      }).catch((cause) =>
        logger.error('[trade-in] notification email failed', { quoteId, cause }),
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
        offerAmount: estimate.averageEstimate,
        offerLow: estimate.lowEstimate,
        offerHigh: estimate.highEstimate,
      }),
    ).catch((cause) =>
      logger.error('[trade-in] ADF forward failed', { quoteId, cause }),
    )

    // Note: trackLead requires a Request object. For server actions,
    // Meta CAPI tracking is handled by the client-side pixel instead.
  } catch (cause) {
    // Never let a side-effect crash the main success response
    logger.error('[trade-in] side-effect threw synchronously', { quoteId, cause })
  }
}
