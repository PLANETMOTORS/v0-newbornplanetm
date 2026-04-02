import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/v1/returns/:id - Get return status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Mock return data
  const returnData = {
    id,
    orderId: "ord_12345",
    status: "approved",
    statusLabel: "Return Approved",
    vehicle: {
      year: 2023,
      make: "Tesla",
      model: "Model Y",
      vin: "5YJYGDEE5MF123456",
    },
    reason: "Changed my mind",
    pickup: {
      scheduledDate: "2024-03-25",
      timeSlot: "10:00 AM - 12:00 PM",
      address: {
        street: "123 Customer Street",
        city: "Toronto",
        province: "ON",
        postalCode: "M5V 1A1",
      },
      driver: {
        name: "James P.",
        phone: "+1 (416) 555-XXXX",
      },
      instructions: "Please have the vehicle ready with all keys and documentation.",
    },
    inspection: {
      status: "pending",
      checklist: [
        { item: "Exterior condition", status: "pending" },
        { item: "Interior condition", status: "pending" },
        { item: "Mechanical systems", status: "pending" },
        { item: "Odometer verification", status: "pending" },
        { item: "Documentation complete", status: "pending" },
      ],
    },
    refund: {
      amount: 45995,
      status: "pending",
      method: "Original payment method",
      estimatedDate: "2024-03-30",
    },
    timeline: [
      {
        step: "Return requested",
        status: "completed",
        timestamp: "2024-03-20T10:00:00Z",
      },
      {
        step: "Return approved",
        status: "completed",
        timestamp: "2024-03-21T14:00:00Z",
      },
      {
        step: "Pickup scheduled",
        status: "completed",
        timestamp: "2024-03-22T09:00:00Z",
      },
      {
        step: "Vehicle pickup",
        status: "upcoming",
        scheduledDate: "2024-03-25",
      },
      {
        step: "Vehicle inspection",
        status: "upcoming",
      },
      {
        step: "Refund processed",
        status: "upcoming",
      },
    ],
    createdAt: "2024-03-20T10:00:00Z",
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json({ return: returnData })
}

// POST /api/v1/returns/:id/schedule-pickup - Schedule vehicle pickup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { date, timeSlot, address, contactPhone } = body

  if (!date || !timeSlot || !address) {
    return NextResponse.json(
      { error: "Date, time slot, and address are required" },
      { status: 400 }
    )
  }

  const pickup = {
    returnId: id,
    scheduledDate: date,
    timeSlot,
    address,
    contactPhone,
    status: "confirmed",
    confirmationNumber: "PKP-" + Date.now().toString(36).toUpperCase(),
    instructions: [
      "Please have the vehicle ready in the driveway or accessible area",
      "Ensure all personal belongings are removed",
      "Have both sets of keys ready",
      "Have the registration and any documentation ready",
    ],
  }

  return NextResponse.json({ success: true, pickup })
}
