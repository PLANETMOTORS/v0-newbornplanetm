import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { gateway } from "@ai-sdk/gateway"

export async function POST(request: NextRequest) {
  try {
    const { year, make, model, trim, mileage, condition } = await request.json()

    if (!year || !make || !model || !mileage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const mileageNum = parseInt(String(mileage).replace(/,/g, ""))
    const currentYear = new Date().getFullYear()
    const vehicleAge = currentYear - parseInt(year)

    // Use AI to analyze and estimate vehicle value based on Canadian market
    const prompt = `You are a Canadian automotive valuation expert. Estimate the trade-in value for this vehicle:

Vehicle: ${year} ${make} ${model}${trim ? ` ${trim}` : ""}
Mileage: ${mileageNum.toLocaleString()} km
Condition: ${condition || "Good"}
Vehicle Age: ${vehicleAge} years

Consider these Canadian market factors:
1. Current Canadian used car market prices (2024-2026)
2. Average depreciation rates for this make/model
3. Mileage impact (Canadian average is 20,000 km/year)
4. Condition adjustment
5. Seasonal factors
6. This is a TRADE-IN value (typically 10-20% below private sale)

For reference, typical Canadian trade-in values:
- High-mileage economy cars (10+ years, 200k+ km): $500-$3,000
- Mid-age sedans (5-8 years, 100-150k km): $5,000-$15,000
- Newer SUVs (3-5 years, 50-80k km): $20,000-$35,000
- Trucks hold value well, luxury depreciates faster

IMPORTANT: Be realistic. A 2015 Jetta with 220,000 km should be worth approximately $1,000-$2,500 for trade-in.

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
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
      valuation = calculateFallbackValue(year, make, model, mileageNum, condition)
    }

    // Validate and sanitize the values
    const sanitizedValuation = {
      lowValue: Math.max(500, Math.round(valuation.lowValue / 50) * 50),
      midValue: Math.max(500, Math.round(valuation.midValue / 50) * 50),
      highValue: Math.max(500, Math.round(valuation.highValue / 50) * 50),
      confidence: valuation.confidence || "medium",
      factors: valuation.factors || [],
      source: "ai-market-analysis",
    }

    return NextResponse.json(sanitizedValuation)
  } catch (error) {
    console.error("Valuation error:", error)
    // Return fallback calculation on any error
    try {
      const { year, make, model, mileage, condition } = await request.json()
      const fallback = calculateFallbackValue(year, make, model, parseInt(String(mileage).replace(/,/g, "")), condition)
      return NextResponse.json({ ...fallback, source: "fallback-algorithm" })
    } catch {
      return NextResponse.json({ error: "Valuation failed" }, { status: 500 })
    }
  }
}

// Fallback algorithmic calculation
function calculateFallbackValue(year: string, make: string, model: string, mileage: number, condition: string) {
  const currentYear = new Date().getFullYear()
  const age = currentYear - parseInt(year)

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
  value *= conditionMultipliers[condition?.toLowerCase()] || 1.0

  // Minimum and rounding
  value = Math.max(500, value)
  value = Math.round(value / 50) * 50

  return {
    lowValue: Math.round(value * 0.90 / 50) * 50,
    midValue: value,
    highValue: Math.round(value * 1.10 / 50) * 50,
    confidence: "medium",
    factors: ["Age-based depreciation", "Mileage adjustment", "Condition factor"],
  }
}
