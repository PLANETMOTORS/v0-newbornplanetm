import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/security/admin-route-helpers"
import { createAdminClient } from "@/lib/supabase/admin"
import { fullPaymentVerification } from "@/lib/reservation-payment-rules"
import type { ReservationPaymentFields } from "@/lib/reservation-payment-rules"
import {
  adminReservationPatchSchema,
  parseAdminPatch,
} from "@/lib/security/admin-mutation-schemas"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.error

    const adminClient = createAdminClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const depositStatus = searchParams.get("deposit_status")

    let query = adminClient
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") query = query.eq("status", status)
    if (depositStatus && depositStatus !== "all") query = query.eq("deposit_status", depositStatus)

    const { data: reservations, error } = await query

    if (error) {
      console.error("Reservations query error:", error)
      return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 })
    }

    // Enrich with vehicle info
    const enriched = await Promise.all(
      (reservations || []).map(async (res) => {
        let vehicle = null
        if (res.vehicle_id) {
          const { data: v } = await adminClient
            .from("vehicles")
            .select("year, make, model, trim, price, stock_number, primary_image_url")
            .eq("id", res.vehicle_id)
            .single()
          vehicle = v
        }
        return { ...res, vehicle }
      })
    )

    // Stats
    const [pendingCount, confirmedCount, completedCount, cancelledCount, totalDeposits] = await Promise.all([
      adminClient.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pending"),
      adminClient.from("reservations").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
      adminClient.from("reservations").select("id", { count: "exact", head: true }).eq("status", "completed"),
      adminClient.from("reservations").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
      adminClient.from("reservations").select("deposit_amount").eq("deposit_status", "paid"),
    ])

    // deposit_amount is stored in cents; convert to dollars for client display
    const totalDepositAmountCents = (totalDeposits.data || []).reduce((sum, r) => sum + (r.deposit_amount || 0), 0)
    const totalDepositAmount = Math.round(totalDepositAmountCents / 100)

    return NextResponse.json({
      reservations: enriched,
      stats: {
        pending: pendingCount.count || 0,
        confirmed: confirmedCount.count || 0,
        completed: completedCount.count || 0,
        cancelled: cancelledCount.count || 0,
        totalDeposits: totalDepositAmount,
      },
    })
  } catch (error) {
    console.error("Reservations API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.error

    const adminClient = createAdminClient()

    const { id, ...rawUpdates } = await request.json()
    if (!id) return NextResponse.json({ error: "Reservation ID required" }, { status: 400 })

    // ── Mass-assignment defence (OWASP API3) ────────────────────────────
    // Whitelist the admin-mutable columns + validate value domains. Any
    // unexpected key (customer_email, vehicle_id, deposit_amount, …) is
    // rejected with a 400 instead of silently rewritten.
    const parsed = parseAdminPatch(adminReservationPatchSchema, rawUpdates)
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Invalid reservation update", details: parsed.issues },
        { status: 400 }
      )
    }
    const updates = parsed.data

    // Payment validation: if attempting to confirm a reservation, verify payment first
    if (updates.status === "confirmed") {
      const { data: existing, error: fetchError } = await adminClient
        .from("reservations")
        .select("deposit_status, stripe_payment_intent_id, stripe_checkout_session_id, status, expires_at")
        .eq("id", id)
        .single()

      if (fetchError || !existing) {
        return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
      }

      // Merge incoming updates with existing data for validation
      const reservationForValidation: ReservationPaymentFields = {
        deposit_status: updates.deposit_status ?? existing.deposit_status,
        stripe_payment_intent_id: existing.stripe_payment_intent_id,
        stripe_checkout_session_id: existing.stripe_checkout_session_id,
        status: existing.status,
        expires_at: updates.expires_at ?? existing.expires_at,
      }

      const validation = await fullPaymentVerification(reservationForValidation)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Cannot confirm reservation: ${validation.reason}` },
          { status: 422 }
        )
      }
    }

    const { data, error } = await adminClient
      .from("reservations")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      // Surface database trigger errors (from enforce_payment_before_confirm)
      if (error.message?.includes("Cannot confirm reservation")) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
      return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 })
    }

    return NextResponse.json({ reservation: data })
  } catch (error) {
    console.error("Reservation update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
