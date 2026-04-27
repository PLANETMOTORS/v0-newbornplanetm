import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { gateway } from "@ai-sdk/gateway"
import { apiError, ErrorCode } from "@/lib/api-response"
import { validateOrigin } from "@/lib/csrf"
import { rateLimit } from "@/lib/redis"
import { getRegionFromPostalCode, getRegionalMultiplier } from "@/lib/postal-regions"

export async function POST(request: NextRequest) {
  // CSRF origin validation
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Forbidden: invalid origin" }, { status: 403 })
  }

  // IP-based rate limiting: 10 valuations per hour per IP
  const forwarded = request.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0]?.trim() || "unknown"
  const limiter = await rateLimit(`valuation:${ip}`, 10, 3600)
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  try {
    const { year, make, model, trim, mileage, condition, postalCode } = await request.json()

    if (!year || !make || !model || !mileage) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Missing required fields", 400)
    }

    const mileageNum = Number.parseInt(String(mileage).replaceAll(",", ""))
    const currentYear = new Date().getFullYear()
    const vehicleAge = currentYear - Number.parseInt(year)

    // Resolve the client's region from their postal code
    const region = getRegionFromPostalCode(postalCode)

    // Use AI to analyze and estimate vehicle value using Live Market approach (like vAuto Provision)
    const prompt = `You are a Canadian automotive valuation expert using a LIVE MARKET approach (similar to vAuto Provision).

IMPORTANT METHODOLOGY:
- Do NOT use simple depreciation formulas or fixed mileage tables
- vAuto's Live Market View uses real-time data from AutoTrader, Manheim, and dealer listings
- "History and book values alone are no longer the best way to appraise vehicles"
- Consider what similar vehicles are ACTUALLY SELLING FOR right now in Canada

Vehicle to Appraise:
- Year: ${year}
- Make: ${make}
- Model: ${model}${trim ? `\n- Trim: ${trim}` : ""}
- Mileage: ${mileageNum.toLocaleString()} km
- Condition: ${condition || "Good"}
- Vehicle Age: ${vehicleAge} years
- Accident History: Clean (no reported accidents)

CLIENT LOCATION:
- Postal Code: ${postalCode || "Not provided"}
- Region: ${region.marketDescription}
- Province: ${region.province}

REGIONAL MARKET FACTORS:
- Value this vehicle for the ${region.regionName} market specifically
- In Alberta/Saskatchewan, trucks & SUVs command a premium due to oil & gas and rural demand
- In BC & Quebec, EVs/PHEVs command a premium due to provincial incentives & charging infrastructure
- In Ontario/GTA, the market is the largest and most liquid — baseline pricing
- Atlantic provinces have smaller markets and salt corrosion reduces vehicle values
- Northern/remote regions have limited buyer pools, lowering values
- Consider local AutoTrader.ca listing prices for this region

LIVE MARKET FACTORS TO CONSIDER:
1. Current AutoTrader.ca listings for similar vehicles in ${region.regionName}
2. Recent Manheim auction results for wholesale values
3. Regional demand in ${region.marketDescription}
4. Supply/demand for this specific make/model/trim
5. Current economic conditions affecting used car market
6. Seasonal factors (SUVs/trucks worth more in winter)
7. This is a TRADE-IN/WHOLESALE value (not private sale retail)

REALISTIC CANADIAN TRADE-IN BENCHMARKS:
- 2015 VW Jetta, 220,000 km, Good: $1,000 - $2,500
- 2020 Toyota RAV4, 60,000 km, Excellent: $28,000 - $32,000
- 2018 Honda Civic, 90,000 km, Good: $14,000 - $17,000
- 2022 Ford F-150, 40,000 km, Excellent: $42,000 - $48,000
- 2026 Tesla Model Y LR, 5,000 km, Excellent: $48,000 - $54,000
- 2019 BMW 3 Series, 70,000 km, Good: $24,000 - $28,000

CRITICAL RULES:
- Trade-in values are 10-20% BELOW private sale prices
- High mileage vehicles (200k+ km) have significantly reduced value
- Older economy cars (10+ years) may only be worth $500-$3,000
- Luxury vehicles depreciate faster than mainstream brands
- Trucks and Toyota/Honda hold value better than average

Respond ONLY with a JSON object (no markdown, no explanation):
{"lowValue": NUMBER, "midValue": NUMBER, "highValue": NUMBER, "confidence": "high"|"medium"|"low", "factors": ["factor1", "factor2", "factor3"]}`

    const { text } = await generateText({
      model: gateway("openai/gpt-4o-mini"),
      prompt,
      temperature: 0.3,
    })

    // Parse AI response
    let valuation
    try {
      // Clean the response - remove any markdown formatting
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      valuation = JSON.parse(cleanedText)
    } catch {
      // Fallback to algorithmic calculation if AI parsing fails
      valuation = calculateFallbackValue(year, make, model, mileageNum, condition, postalCode)
    }

    // Validate and sanitize the values
    const sanitizedValuation = {
      lowValue: Math.max(500, Math.round(valuation.lowValue / 50) * 50),
      midValue: Math.max(500, Math.round(valuation.midValue / 50) * 50),
      highValue: Math.max(500, Math.round(valuation.highValue / 50) * 50),
      confidence: valuation.confidence || "medium",
      factors: valuation.factors || [],
      source: "ai-market-analysis",
      region: region.regionName,
    }

    return NextResponse.json(sanitizedValuation)
  } catch (error) {
    console.error("Valuation error:", error)
    // Return fallback calculation on any error
    try {
      const { year, make, model, mileage, condition, postalCode } = await request.json()
      const fallback = calculateFallbackValue(year, make, model, Number.parseInt(String(mileage).replaceAll(",", "")), condition, postalCode)
      return NextResponse.json({ ...fallback, source: "fallback-algorithm" })
    } catch {
      return apiError(ErrorCode.INTERNAL_ERROR, "Valuation failed")
    }
  }
}

// Fallback algorithmic calculation with regional pricing
function calculateFallbackValue(year: string, make: string, model: string, mileage: number, condition: string, postalCode?: string) {
  const currentYear = new Date().getFullYear()
  const age = currentYear - Number.parseInt(year)

  // Base values by vehicle class
  const baseValues: Record<string, number> = {
    // Economy
    "Jetta": 24000, "Civic": 26000, "Corolla": 24000, "Elantra": 22000,
    "Golf": 25000, "Mazda3": 24000, "Sentra": 21000, "Forte": 21000,
    // Mid-size
    "Accord": 32000, "Camry": 32000, "Sonata": 30000, "Passat": 30000,
    // SUV
    "CR-V": 35000, "RAV4": 35000, "Tucson": 32000, "Tiguan": 34000,
    "Highlander": 48000, "Pilot": 48000,
    // Trucks
    "F-150": 55000, "Silverado": 52000, "Tacoma": 42000,
    // Luxury
    "3 Series": 52000, "C-Class": 50000, "Model 3": 55000,
  }

  const makeTiers: Record<string, number> = {
    "BMW": 45000, "Mercedes-Benz": 48000, "Audi": 45000, "Lexus": 42000,
    "Tesla": 55000, "Toyota": 28000, "Honda": 28000, "Volkswagen": 27000,
    "Hyundai": 25000, "Kia": 25000, "Ford": 30000, "Chevrolet": 28000,
  }

  let baseValue = baseValues[model] || makeTiers[make] || 28000

  // Depreciation
  let value = baseValue
  for (let y = 0; y < age; y++) {
    if (y === 0) value *= 0.80
    else if (y === 1) value *= 0.85
    else if (y === 2) value *= 0.88
    else if (y < 6) value *= 0.90
    else value *= 0.92
  }

  // Mileage adjustment
  const expectedMileage = age * 20000
  const mileageDiff = mileage - expectedMileage
  if (mileageDiff > 0) {
    value -= mileageDiff * 0.05
    if (mileage > 150000) value -= (mileage - 150000) * 0.03
    if (mileage > 200000) value -= (mileage - 200000) * 0.02
  }

  // Condition
  const conditionMultipliers: Record<string, number> = {
    "excellent": 1.10, "good": 1.00, "fair": 0.85, "poor": 0.65,
  }
  value *= conditionMultipliers[condition?.toLowerCase()] || 1

  // Regional adjustment based on postal code
  const { multiplier, region, vehicleType } = getRegionalMultiplier(postalCode, make, model)
  value *= multiplier

  const factors = [
    "Age-based depreciation",
    "Mileage adjustment",
    "Condition factor",
    `Regional market: ${region.regionName}`,
  ]
  if (vehicleType === "truck" || vehicleType === "suv") {
    factors.push(`${vehicleType === "truck" ? "Truck" : "SUV"} demand premium in ${region.province}`)
  }
  if (vehicleType === "ev") {
    factors.push(`EV market adjustment for ${region.province}`)
  }

  // Minimum and rounding
  value = Math.max(500, value)
  value = Math.round(value / 50) * 50

  return {
    lowValue: Math.round(value * 0.90 / 50) * 50,
    midValue: value,
    highValue: Math.round(value * 1.10 / 50) * 50,
    confidence: "medium",
    factors,
    region: region.regionName,
  }
}
