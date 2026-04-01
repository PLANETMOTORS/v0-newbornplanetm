import { NextResponse } from "next/server"

// Mock delivery data - in production, this would come from GPS tracking system
const mockDeliveries: Record<string, {
  orderId: string
  vehicleName: string
  status: "preparing" | "in-transit" | "nearby" | "delivered"
  estimatedArrival: string
  driver: {
    name: string
    phone: string
    photo: string
  }
  currentLocation: {
    lat: number
    lng: number
    address: string
  }
  destination: {
    lat: number
    lng: number
    address: string
  }
  timeline: Array<{
    status: string
    timestamp: string
    description: string
  }>
}> = {
  "DL-2024-001": {
    orderId: "DL-2024-001",
    vehicleName: "2024 Tesla Model Y Long Range",
    status: "in-transit",
    estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    driver: {
      name: "Michael Chen",
      phone: "(416) 555-0199",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    currentLocation: {
      lat: 43.7615,
      lng: -79.4111,
      address: "Highway 401, North York, ON",
    },
    destination: {
      lat: 43.8561,
      lng: -79.3370,
      address: "123 Main St, Richmond Hill, ON L4C 1A1",
    },
    timeline: [
      { status: "Order Confirmed", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), description: "Your order has been confirmed" },
      { status: "Vehicle Inspection", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: "210-point inspection completed" },
      { status: "Detailing Complete", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), description: "Vehicle detailed and ready" },
      { status: "Out for Delivery", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), description: "Driver en route to your location" },
    ],
  },
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get("orderId")

  if (!orderId) {
    return NextResponse.json(
      { error: "Order ID is required" },
      { status: 400 }
    )
  }

  // Look up delivery
  const delivery = mockDeliveries[orderId]

  if (!delivery) {
    // Return demo data for any order ID
    return NextResponse.json({
      success: true,
      data: {
        orderId,
        vehicleName: "2024 Tesla Model 3 Performance",
        status: "in-transit",
        estimatedArrival: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
        driver: {
          name: "Sarah Johnson",
          phone: "(416) 555-0188",
          photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        },
        currentLocation: {
          lat: 43.7800,
          lng: -79.3900,
          address: "Approaching Highway 7, Thornhill, ON",
        },
        destination: {
          lat: 43.8561,
          lng: -79.3370,
          address: "Your delivery address",
        },
        timeline: [
          { status: "Order Confirmed", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: "Your order has been confirmed" },
          { status: "Vehicle Inspection", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), description: "210-point inspection completed" },
          { status: "Detailing Complete", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), description: "Vehicle detailed and ready" },
          { status: "Out for Delivery", timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), description: "Driver en route to your location" },
        ],
        distanceRemaining: "12 km",
        etaMinutes: 25,
      },
    })
  }

  return NextResponse.json({
    success: true,
    data: delivery,
  })
}
