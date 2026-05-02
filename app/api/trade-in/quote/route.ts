import { sendNotificationEmail } from "@/lib/email"
import { validateOrigin } from "@/lib/csrf"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"
import { trackLead } from "@/lib/meta-capi-helpers"

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
      baseValue *= 0.90
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
    excellent: 1.10,
    good: 1.00,
    fair: 0.85,
    poor: 0.65,
  }
  baseValue *= conditionMultipliers[data.condition]

  // Calculate range
  const lowEstimate = Math.round(baseValue * 0.90)
  const highEstimate = Math.round(baseValue * 1.10)
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
    const data = await req.json()
    const { year, make, model, mileage, condition, vin, customerName, customerEmail, customerPhone } = data

    // Validate required fields
    if (!year || !make || !model || !mileage || !condition) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Missing required fields", 400)
    }

    // Calculate estimate
    const estimate = estimateTradeInValue({
      year: parseInt(year),
      make,
      model,
      mileage: parseInt(mileage),
      condition,
      vin,
    })

    // Generate quote ID
    const quoteId = `TQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // Send notification email to admin
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
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      message: "This is an estimated value. Final offer subject to in-person inspection.",
    })
  } catch (error) {
    console.error("Trade-in quote error:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to generate quote")
  }
}
