import { NextRequest, NextResponse } from "next/server"

// GET /api/v1/deliveries/:id/tracking - Get real-time tracking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Mock tracking data - in production this would come from delivery partner API
  const tracking = {
    deliveryId: id,
    status: "in_transit",
    statusLabel: "In Transit",
    estimatedArrival: "Today, 2:00 PM - 4:00 PM",
    driver: {
      name: "Mike T.",
      phone: "+1 (416) 555-XXXX", // Masked for privacy
      rating: 4.9,
      vehicleType: "Car hauler",
    },
    currentLocation: {
      lat: 43.7615,
      lng: -79.4111,
      city: "North York",
      province: "ON",
      lastUpdate: new Date().toISOString(),
    },
    route: {
      origin: {
        lat: 43.8828,
        lng: -79.4403,
        address: "Richmond Hill, ON",
      },
      destination: {
        lat: 43.6532,
        lng: -79.3832,
        address: "Toronto, ON",
      },
      distanceRemaining: "15 km",
      etaMinutes: 25,
    },
    timeline: [
      {
        status: "Order confirmed",
        timestamp: "2024-03-20T09:00:00Z",
        completed: true,
      },
      {
        status: "Vehicle inspected",
        timestamp: "2024-03-20T10:30:00Z",
        completed: true,
      },
      {
        status: "Loaded for delivery",
        timestamp: "2024-03-20T11:00:00Z",
        completed: true,
      },
      {
        status: "In transit",
        timestamp: "2024-03-20T11:30:00Z",
        completed: true,
        current: true,
      },
      {
        status: "Delivered",
        timestamp: null,
        completed: false,
      },
    ],
    updates: [
      {
        message: "Your vehicle is on the way! Driver Mike is 15 km away.",
        timestamp: new Date().toISOString(),
        type: "info",
      },
      {
        message: "Vehicle loaded and departed from Planet Motors facility.",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: "update",
      },
    ],
  }

  return NextResponse.json({ tracking })
}
