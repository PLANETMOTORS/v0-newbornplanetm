import { NextRequest, NextResponse } from "next/server"

// GET /api/v1/customers/me/favorites - Get customer's favorite vehicles
export async function GET(request: NextRequest) {
  // Get favorites from database based on authenticated user
  const favorites = [
    {
      id: "fav_001",
      vehicleId: "veh_001",
      vehicle: {
        id: "veh_001",
        year: 2023,
        make: "Tesla",
        model: "Model Y",
        trim: "Long Range AWD",
        price: 52995,
        originalPrice: 55995,
        mileage: 12500,
        image: "https://cdn.planetmotors.ca/vehicles/tesla-model-y-2023.jpg",
        status: "available",
      },
      addedAt: "2024-03-15T10:00:00Z",
      priceAtSave: 55995,
      priceChange: -3000,
      alerts: {
        priceDropEnabled: true,
        soldAlertEnabled: true,
      },
    },
    {
      id: "fav_002",
      vehicleId: "veh_002",
      vehicle: {
        id: "veh_002",
        year: 2022,
        make: "BMW",
        model: "X5",
        trim: "xDrive40i",
        price: 68995,
        mileage: 28000,
        image: "https://cdn.planetmotors.ca/vehicles/bmw-x5-2022.jpg",
        status: "available",
      },
      addedAt: "2024-03-10T14:30:00Z",
      priceAtSave: 68995,
      priceChange: 0,
      alerts: {
        priceDropEnabled: true,
        soldAlertEnabled: false,
      },
    },
  ]

  return NextResponse.json({ favorites, count: favorites.length })
}

// POST /api/v1/customers/me/favorites - Add vehicle to favorites
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { vehicleId, alerts } = body

  if (!vehicleId) {
    return NextResponse.json(
      { error: "Vehicle ID is required" },
      { status: 400 }
    )
  }

  const favorite = {
    id: "fav_" + Date.now(),
    vehicleId,
    addedAt: new Date().toISOString(),
    alerts: alerts || {
      priceDropEnabled: true,
      soldAlertEnabled: true,
    },
  }

  return NextResponse.json({ success: true, favorite })
}

// DELETE is handled by /api/v1/customers/me/favorites/[id]/route.ts
