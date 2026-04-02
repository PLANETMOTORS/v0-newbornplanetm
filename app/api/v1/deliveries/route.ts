import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Origin location: L4C 1G7, Richmond Hill, Ontario
const ORIGIN_COORDS = { lat: 43.8828, lng: -79.4403 }

// Delivery pricing tiers (per km)
const DELIVERY_TIERS = [
  { maxKm: 300, pricePerKm: 0 }, // FREE
  { maxKm: 499, pricePerKm: 0.70 },
  { maxKm: 999, pricePerKm: 0.75 },
  { maxKm: 2000, pricePerKm: 0.80 },
  { maxKm: 5000, pricePerKm: 0.65 },
]

function calculateDeliveryCost(distanceKm: number): number {
  if (distanceKm <= 300) return 0
  
  let cost = 0
  let remainingKm = distanceKm
  let lastMaxKm = 0
  
  for (const tier of DELIVERY_TIERS) {
    if (remainingKm <= 0) break
    
    const kmInTier = Math.min(remainingKm, tier.maxKm - lastMaxKm)
    if (kmInTier > 0 && tier.pricePerKm > 0) {
      cost += kmInTier * tier.pricePerKm
    }
    remainingKm -= kmInTier
    lastMaxKm = tier.maxKm
  }
  
  return Math.round(cost * 100) / 100
}

// POST /api/v1/deliveries - Schedule delivery
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, vehicleId, destinationPostalCode, scheduledDate, timeSlot, specialInstructions } = body

    if (!orderId || !vehicleId || !destinationPostalCode || !scheduledDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Calculate distance using Google Maps API
    const estimatedDistanceKm = 250 // Mock
    const deliveryCost = calculateDeliveryCost(estimatedDistanceKm)

    const delivery = {
      id: "del_" + Date.now(),
      orderId,
      vehicleId,
      origin: {
        address: "1234 Auto Park Drive",
        city: "Richmond Hill",
        province: "ON",
        postalCode: "L4C 1G7",
      },
      destination: {
        postalCode: destinationPostalCode,
      },
      distanceKm: estimatedDistanceKm,
      cost: deliveryCost,
      isFree: deliveryCost === 0,
      scheduledDate,
      timeSlot,
      specialInstructions,
      status: "scheduled",
      estimatedDeliveryDate: scheduledDate,
      tracking: {
        currentStatus: "Preparing for shipment",
        lastUpdate: new Date().toISOString(),
        history: [
          {
            status: "Order placed",
            timestamp: new Date().toISOString(),
            location: "Richmond Hill, ON",
          }
        ]
      },
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, delivery })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to schedule delivery" },
      { status: 500 }
    )
  }
}

// GET /api/v1/deliveries - Get available time slots
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  // Generate available time slots for next 14 days
  const slots = []
  const startDate = date ? new Date(date) : new Date()
  
  for (let i = 1; i <= 14; i++) {
    const slotDate = new Date(startDate)
    slotDate.setDate(slotDate.getDate() + i)
    
    // Skip Sundays
    if (slotDate.getDay() === 0) continue
    
    const dayOfWeek = slotDate.getDay()
    slots.push({
      date: slotDate.toISOString().split("T")[0],
      slots: [
        { time: "9:00 AM - 12:00 PM", available: dayOfWeek !== 6 }, // Not Saturday morning
        { time: "12:00 PM - 3:00 PM", available: true },
        { time: "3:00 PM - 6:00 PM", available: dayOfWeek !== 5 }, // Not Friday evening
      ]
    })
  }

  return NextResponse.json({ availableSlots: slots })
}
