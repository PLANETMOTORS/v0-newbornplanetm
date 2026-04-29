import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, getProfileField } from "@/lib/api/auth-helpers"

// GET /api/v1/customers/me/favorites - Get customer's favorite vehicles
export async function GET(_request: NextRequest) {
  const auth = await getAuthenticatedUser()
  if (auth.error) return auth.error

  const result = await getProfileField<{ saved_vehicles?: string[] }>(
    auth.supabase, auth.user.id, "saved_vehicles", "Failed to fetch favorites",
  )
  if (result.error) return result.error

  const savedVehicleIds: string[] = result.profile?.saved_vehicles ?? []

  if (savedVehicleIds.length === 0) {
    return NextResponse.json({ favorites: [], count: 0 })
  }

  const { data: vehicles, error: vehiclesError } = await auth.supabase
    .from("vehicles")
    .select("id, year, make, model, trim, price, mileage, status")
    .in("id", savedVehicleIds)

  if (vehiclesError) {
    return NextResponse.json({ error: "Failed to fetch vehicle details" }, { status: 500 })
  }

  const favorites = (vehicles ?? []).map((v) => ({
    id: `fav_${v.id}`,
    vehicleId: String(v.id),
    vehicle: {
      id: String(v.id),
      year: v.year,
      make: v.make,
      model: v.model,
      trim: v.trim,
      // price stored in cents in DB; convert to dollars for the API response
      price: typeof v.price === "number" ? v.price / 100 : Number(v.price || 0),
      mileage: v.mileage,
      status: v.status,
    },
    addedAt: new Date().toISOString(),
  }))

  return NextResponse.json({ favorites, count: favorites.length })
}

// POST /api/v1/customers/me/favorites - Add vehicle to favorites
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  const body = await request.json()
  const { vehicleId } = body

  if (!vehicleId) {
    return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 })
  }

  // Confirm the vehicle actually exists before saving
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .maybeSingle()

  if (vehicleError || !vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
  }

  // Fetch current saved list to avoid duplicates
  const { data: profile } = await supabase
    .from("profiles")
    .select("saved_vehicles")
    .eq("id", user.id)
    .maybeSingle()

  const current: string[] = profile?.saved_vehicles ?? []

  if (current.includes(String(vehicleId))) {
    return NextResponse.json({ success: true, message: "Already in favorites" })
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      saved_vehicles: [...current, String(vehicleId)],
      updated_at: new Date().toISOString(),
    })

  if (updateError) {
    return NextResponse.json({ error: "Failed to add to favorites" }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    favorite: { id: `fav_${vehicleId}`, vehicleId: String(vehicleId), addedAt: new Date().toISOString() },
  })
}

// DELETE is handled by /api/v1/customers/me/favorites/[id]/route.ts
