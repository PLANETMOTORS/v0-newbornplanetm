import { randomBytes } from "node:crypto"
import { sendNotificationEmail } from "@/lib/email"
import { validateOrigin } from "@/lib/csrf"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"
import { trackLead } from "@/lib/meta-capi-helpers"
import { rateLimit } from "@/lib/redis"
import { getClientIp } from "@/lib/security/client-ip"
import { createAdminClient } from "@/lib/supabase/admin"

// Vehicle value estimation algorithm
function estimateTradeInValue(data: {
  year: number
  make: string
  model: string
  mileage: number
  condition: "excellent" | "good" | "fair" | "poor"
  vin?: string
}): { lowEstimate: number; highEstimate: number; averageEstimate: number } {
  const currentYear = new Date().getFullYear()
  const vehicleAge = currentYear - data.year

  // Base value lookup (simplified - in production, use Canadian Black Book API)
  const baseValues: Record<string, number> = {
    tesla: 45000,
    bmw: 35000,
    mercedes: 38000,
    audi: 32000,
    porsche: 55000,
    toyota: 28000,
    honda: 26000,
    ford: 24000,
    chevrolet: 22000,
    nissan: 20000,
    hyundai: 18000,
    kia: 17000,
    volkswagen: 22000,
    mazda: 20000,
    subaru: 24000,
    lexus: 35000,
    acura: 28000,
    infiniti: 26000,
    default: 20000,
  }

  const makeKey = data.make.toLowerCase()
  let baseValue = baseValues[makeKey] || baseValues.default

  // Age depreciation (roughly 15% per year for first 3 years, 10% after)
  for (let i = 0; i < vehicleAge; i++) {
    if (i < 3) {
      baseValue *= 0.85
    } else {
      baseValue *= 0.9
    }
  }

  // Mileage adjustment (average 20,000 km/year)
  const expectedMileage = vehicleAge * 20000
  const mileageDiff = data.mileage - expectedMileage
  if (mileageDiff > 0) {
    // Higher than average mileage - deduct
    baseValue -= (mileageDiff / 10000) * 500
  } else {
    // Lower than average - add value
    baseValue += (Math.abs(mileageDiff) / 10000) * 300
  }

  // Condition adjustment
  const conditionMultipliers = {
    excellent: 1.1,
    good: 1,
    fair: 0.85,
    poor: 0.65,
  }
  baseValue *= conditionMultipliers[data.condition]

  // Calculate range
  const lowEstimate = Math.round(baseValue * 0.9)
  const highEstimate = Math.round(baseValue * 1.1)
  const averageEstimate = Math.round(baseValue)

  return {
    lowEstimate: Math.max(lowEstimate, 500),
    highEstimate: Math.max(highEstimate, 1000),
    averageEstimate: Math.max(averageEstimate, 750),
  }
}

export async function POST(req: Request) {
  try {
    if (!validateOrigin(req)) {
      return apiError(ErrorCode.FORBIDDEN, "Forbidden", 403)
    }

    const ip = getClientIp(req)
    const limiter = await rateLimit(`trade-in-quote:${ip}`, 10, 3600)
    if (!limiter.success) {
      return apiError(ErrorCode.RATE_LIMITED, "Too many requests. Please try again later.", 429)
    }

    const data = await req.json()
    const { year, make, model, mileage, condition, vin, customerName, customerEmail, customerPhone } = data

    // Validate required fields
    if (!year || !make || !model || !mileage || !condition) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Missing required fields", 400)
    }

    // Calculate estimate
    const estimate = estimateTradeInValue({
      year: Number.parseInt(year),
      make,
      model,
      mileage: Number.parseInt(mileage),
      condition,
      vin,
    })

    // Generate quote ID
    const quoteId = `TQ-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // ── Persist to trade_in_quotes table ────────────────────────────────
    // Critical for /admin/trade-ins to surface the lead. Without this insert
    // the customer received an email confirmation but the dealer never saw
    // the lead in the admin UI (Analytics: 0 trade-ins). Reproduced live on
    // 2026-04-30 by Jenny Iagoudakis (2008 BMW E60 M5, TQ-1777577854248-...).
    //
    // We use the service-role admin client so the insert succeeds even
    // when the customer is unauthenticated. The `Anyone can insert quotes`
    // RLS policy in scripts/create-trade-in-quotes-table.sql also permits
    // anon inserts, but service-role bypasses RLS for clarity + reliability.
    let persistError: string | null = null
    try {
      const supabase = createAdminClient()
      const { error: insertError } = await supabase
        .from("trade_in_quotes")
        .insert({
          quote_id: quoteId,
          vehicle_year: Number.parseInt(year),
          vehicle_make: make,
          vehicle_model: model,
          mileage: Number.parseInt(mileage),
          condition,
          vin: vin || null,
          customer_name: customerName || null,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          offer_amount: estimate.averageEstimate,
          offer_low: estimate.lowEstimate,
          offer_high: estimate.highEstimate,
          status: "pending",
          valid_until: validUntil,
          source: "instant_quote",
        })
      if (insertError) {
        persistError = insertError.message
        console.error("[trade-in] DB insert failed:", insertError)
      }
    } catch (err) {
      persistError = err instanceof Error ? err.message : "Unknown error"
      console.error("[trade-in] DB insert exception:", err)
    }

    // Send notification email to admin (regardless of DB persist outcome —
    // we don't want to lose the lead if Postgres is briefly down)
    if (customerEmail) {
      await sendNotificationEmail({
        type: 'trade_in_quote',
        customerName: customerName || 'Customer',
        customerEmail,
        customerPhone,
        vehicleInfo: `${year} ${make} ${model}`,
        quoteId,
        tradeInValue: estimate.averageEstimate,
      })
    }

    // Fire Meta CAPI Lead event (non-blocking)
    trackLead(req, {
      email: customerEmail,
      phone: customerPhone,
      firstName: customerName,
      value: estimate.averageEstimate,
      contentName: `${year} ${make} ${model} Trade-In`,
      contentCategory: "trade_in",
    })

    return apiSuccess({
      quoteId,
      vehicle: {
        year,
        make,
        model,
        mileage,
        condition,
        vin,
      },
      estimate: {
        low: estimate.lowEstimate,
        high: estimate.highEstimate,
        average: estimate.averageEstimate,
        currency: "CAD",
      },
      validUntil,
      message: "This is an estimated value. Final offer subject to in-person inspection.",
      // `persistError` surfaced for server logs / observability; never blocks
      // the customer-facing response since the email was already sent.
      ...(persistError ? { _persistWarning: "Quote saved via email; database sync pending." } : {}),
    })
  } catch (error) {
    console.error("Trade-in quote error:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to generate quote")
  }
}
