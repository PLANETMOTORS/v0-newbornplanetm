import { NextRequest, NextResponse } from 'next/server'
import { sendNotificationEmail } from '@/lib/email'

// Mock CBB valuation data
const getVehicleValue = (year: number, make: string, model: string, mileage: number, condition: string) => {
  // Base values by segment (simplified)
  const baseValues: Record<string, number> = {
    'Honda Accord': 28000,
    'Honda Civic': 24000,
    'Toyota Camry': 29000,
    'Toyota Corolla': 23000,
    'Ford F-150': 42000,
    'Chevrolet Silverado': 40000,
    'Tesla Model 3': 48000,
    'Tesla Model Y': 55000,
    'BMW 3 Series': 45000,
    'Mercedes-Benz C-Class': 47000,
  }
  
  const key = `${make} ${model}`
  let baseValue = baseValues[key] || 25000
  
  // Depreciation by age (roughly 15% per year)
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  baseValue *= Math.pow(0.85, age)
  
  // Mileage adjustment (average 20,000 km/year)
  const expectedMileage = age * 20000
  const mileageDiff = mileage - expectedMileage
  if (mileageDiff > 0) {
    // Over mileage: deduct $0.10 per km
    baseValue -= mileageDiff * 0.10
  } else {
    // Under mileage: add $0.05 per km
    baseValue += Math.abs(mileageDiff) * 0.05
  }
  
  // Condition adjustment
  const conditionMultipliers: Record<string, number> = {
    excellent: 1.1,
    good: 1.0,
    fair: 0.9,
    poor: 0.75,
  }
  baseValue *= conditionMultipliers[condition] || 1.0
  
  // Calculate range
  const lowValue = baseValue * 0.92
  const highValue = baseValue * 1.08
  
  return {
    low: Math.round(lowValue / 100) * 100,
    mid: Math.round(baseValue / 100) * 100,
    high: Math.round(highValue / 100) * 100,
  }
}

// POST /api/v1/trade-in/instant-offer - Get instant offer
export async function POST(request: NextRequest) {
  // CSRF protection
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } },
      { status: 403 }
    )
  }

  // Rate limit: 10 trade-in valuations per hour per IP
  const forwarded = request.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0]?.trim() || "unknown"
  const limiter = await rateLimit(`trade-in:${ip}`, 10, 3600)
  if (!limiter.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
      { status: 429 }
    )
  }

  const body = await request.json()
  
  const {
    // Vehicle Info
    vin,
    year,
    make,
    model,
    trim,
    mileage,
    exteriorColor,
    interiorColor,
    
    // Condition
    condition, // excellent, good, fair, poor
    accidentHistory,
    mechanicalIssues,
    cosmeticIssues,
    
    // Payoff
    hasLien,
    lienHolder,
    payoffAmount,
    
    // Customer
    customerId,
    email,
    phone,
  } = body

  // Validate required fields
  if (!year || !make || !model || !mileage) {
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'MISSING_FIELDS', 
          message: 'Year, make, model, and mileage are required' 
        } 
      },
      { status: 400 }
    )
  }

  // Get CBB valuation
  const cbbValue = getVehicleValue(year, make, model, mileage, condition || 'good')
  
  // Adjust for condition factors
  let adjustedValue = cbbValue.mid
  
  // Accident history deduction
  if (accidentHistory) {
    adjustedValue *= 0.85 // 15% deduction
  }
  
  // Mechanical issues deduction
  if (mechanicalIssues && mechanicalIssues.length > 0) {
    adjustedValue -= mechanicalIssues.length * 500 // $500 per issue
  }
  
  // Cosmetic issues deduction
  if (cosmeticIssues && cosmeticIssues.length > 0) {
    adjustedValue -= cosmeticIssues.length * 250 // $250 per issue
  }
  
  // Calculate equity (if there's a lien)
  const equity = hasLien ? adjustedValue - (payoffAmount || 0) : adjustedValue
  
  // Generate offer
  const offerNumber = `TO-${Date.now().toString(36).toUpperCase()}`
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  const offer = {
    id: `offer-${Date.now()}`,
    offerNumber,
    customerId,
    status: 'pending',
    
    // Vehicle
    vehicle: {
      vin,
      year,
      make,
      model,
      trim,
      mileage,
      exteriorColor,
      interiorColor,
      condition: condition || 'good',
    },
    
    // Valuation
    cbbValue: {
      low: cbbValue.low,
      mid: cbbValue.mid,
      high: cbbValue.high,
      source: 'Canadian Black Book',
      date: new Date().toISOString(),
    },
    
    // Adjustments
    adjustments: [
      accidentHistory ? { reason: 'Accident history', amount: -(cbbValue.mid * 0.15) } : null,
      mechanicalIssues?.length ? { reason: 'Mechanical issues', amount: -(mechanicalIssues.length * 500) } : null,
      cosmeticIssues?.length ? { reason: 'Cosmetic issues', amount: -(cosmeticIssues.length * 250) } : null,
    ].filter(Boolean),
    
    // Offer
    offerAmount: Math.round(adjustedValue / 100) * 100,
    
    // Payoff
    payoff: hasLien ? {
      hasLien: true,
      lienHolder,
      payoffAmount,
      equity: Math.round(equity / 100) * 100,
    } : {
      hasLien: false,
      equity: Math.round(adjustedValue / 100) * 100,
    },
    
    // Timing
    expiresAt: expiresAt.toISOString(),
    validDays: 7,
    
    // Next steps
    nextSteps: [
      'Review your instant offer',
      'Upload photos for potential increase',
      'Accept offer and schedule pickup',
      'Or apply it to your new vehicle purchase',
    ],
    
    createdAt: new Date().toISOString(),
  }

  // Send notification email to admin
  if (email) {
    await sendNotificationEmail({
      type: 'trade_in_quote',
      customerName: customerId || 'Customer',
      customerEmail: email,
      customerPhone: phone,
      vehicleInfo: `${year} ${make} ${model}`,
      quoteId: offerNumber,
      tradeInValue: offer.offerAmount,
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      offer,
      message: `Your ${year} ${make} ${model} is worth approximately $${offer.offerAmount.toLocaleString()} CAD`,
      comparison: {
        vsPrivateSale: Math.round(offer.offerAmount * 1.15), // Private sale usually higher
        vsDealerTrade: Math.round(offer.offerAmount * 0.9), // Traditional dealer usually lower
        planetMotorsAdvantage: 'Instant offer, no haggling, free pickup',
      },
    },
  })
}

// GET /api/v1/trade-in/valuation - Get CBB valuation (public)
export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const year = parseInt(searchParams.get('year') || '0')
  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''
  const mileage = parseInt(searchParams.get('mileage') || '0')
  const condition = searchParams.get('condition') || 'good'

  if (!year || !make || !model || !mileage) {
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'MISSING_PARAMS', 
          message: 'Year, make, model, and mileage are required' 
        } 
      },
      { status: 400 }
    )
  }

  const value = getVehicleValue(year, make, model, mileage, condition)

  return NextResponse.json({
    success: true,
    data: {
      valuation: {
        year,
        make,
        model,
        mileage,
        condition,
        value,
        source: 'Canadian Black Book',
        date: new Date().toISOString(),
      },
    },
  })
}
