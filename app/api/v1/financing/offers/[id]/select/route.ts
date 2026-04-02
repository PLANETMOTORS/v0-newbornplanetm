import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/v1/financing/offers/:id/select - Select a lender offer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: offerId } = await params
  const body = await request.json()
  const { vehicleId, customerId, downPayment, tradeInValue } = body

  if (customerId && customerId !== user.id) {
    return NextResponse.json({ error: "customerId must match authenticated user" }, { status: 403 })
  }

  // Validate offer exists and is still valid
  // In production, fetch from database

  const selection = {
    id: "sel_" + Date.now(),
    offerId,
    vehicleId,
    customerId: user.id,
    status: "pending_documents",
    selectedAt: new Date().toISOString(),
    offer: {
      lenderId: "td",
      lenderName: "TD Auto Finance",
      rate: 5.49,
      term: 72,
      monthlyPayment: 749.99,
    },
    financing: {
      vehiclePrice: 48200,
      downPayment: downPayment || 5000,
      tradeInValue: tradeInValue || 0,
      amountFinanced: 48200 - (downPayment || 5000) - (tradeInValue || 0),
      totalInterest: 5999.28,
      totalCost: 53999.28,
    },
    requiredDocuments: [
      {
        type: "proof_of_income",
        name: "Proof of Income",
        description: "Recent pay stubs (last 2) or T4/NOA",
        status: "required",
        uploadUrl: null,
      },
      {
        type: "drivers_license",
        name: "Driver's License",
        description: "Valid Canadian driver's license (front & back)",
        status: "required",
        uploadUrl: null,
      },
      {
        type: "proof_of_address",
        name: "Proof of Address",
        description: "Utility bill or bank statement (within 90 days)",
        status: "required",
        uploadUrl: null,
      },
      {
        type: "void_cheque",
        name: "Void Cheque or Bank Letter",
        description: "For pre-authorized payment setup",
        status: "required",
        uploadUrl: null,
      },
    ],
    nextSteps: [
      "Upload required documents",
      "Sign financing agreement",
      "Schedule delivery or pickup",
    ],
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
  }

  return NextResponse.json({ success: true, selection })
}
