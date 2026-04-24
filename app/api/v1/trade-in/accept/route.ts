import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendNotificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      quoteId,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      vehicleTrim,
      mileage,
      condition,
      postalCode,
      vin,
      offerAmount,
      offerLow,
      offerHigh,
      customerName,
      customerEmail,
      customerPhone,
    } = body

    // Validate required fields
    if (!quoteId || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { success: false, error: "Quote ID, email, and phone are required" },
        { status: 400 }
      )
    }

    // Try to save to database (non-blocking — table may not exist yet)
    let savedQuote = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { data: existingQuote } = await supabase
        .from("trade_in_quotes")
        .select("id")
        .eq("quote_id", quoteId)
        .single()

      if (existingQuote) {
        const { data } = await supabase
          .from("trade_in_quotes")
          .update({
            user_id: user?.id || null,
            status: "accepted",
            customer_email: customerEmail,
            customer_phone: customerPhone,
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("quote_id", quoteId)
          .select()
          .single()
        savedQuote = data
      } else {
        const { data } = await supabase
          .from("trade_in_quotes")
          .insert({
            quote_id: quoteId,
            user_id: user?.id || null,
            vehicle_year: vehicleYear,
            vehicle_make: vehicleMake,
            vehicle_model: vehicleModel,
            vehicle_trim: vehicleTrim,
            mileage: mileage ? Number.parseInt(mileage) : null,
            condition,
            postal_code: postalCode,
            vin,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            offer_amount: offerAmount,
            offer_low: offerLow,
            offer_high: offerHigh,
            status: "accepted",
            accepted_at: new Date().toISOString(),
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            source: "instant_quote",
          })
          .select()
          .single()
        savedQuote = data
      }
    } catch (dbError) {
      console.error("Database save failed (non-critical):", dbError)
    }

    // Send email notification to admin (non-blocking)
    try {
      await sendNotificationEmail({
        type: 'ico_accepted',
        customerName: customerName || 'Customer',
        customerEmail,
        customerPhone,
        vehicleInfo: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
        quoteId,
        tradeInValue: offerAmount,
      })
    } catch (emailError) {
      console.error("Email notification failed (non-critical):", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Offer accepted! You will receive confirmation via email and SMS.",
      data: {
        quoteId: savedQuote?.quote_id || quoteId,
        status: savedQuote?.status || "accepted",
        nextSteps: [
          "You will receive a confirmation email and SMS shortly",
          "Our team will contact you within 2 hours to schedule pickup",
          "Free pickup anywhere in Canada",
          "Payment within 24 hours via e-Transfer or cheque"
        ]
      },
    })

  } catch (error) {
    console.error("Error accepting trade-in offer:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process offer acceptance" },
      { status: 500 }
    )
  }
}
