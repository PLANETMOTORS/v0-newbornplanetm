import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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

    // Get current user if authenticated (optional for sell-only)
    const { data: { user } } = await supabase.auth.getUser()

    // Save or update the quote with accepted status
    const { data: existingQuote } = await supabase
      .from("trade_in_quotes")
      .select("id")
      .eq("quote_id", quoteId)
      .single()

    let savedQuote

    if (existingQuote) {
      // Update existing quote
      const { data, error } = await supabase
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

      if (error) throw error
      savedQuote = data
    } else {
      // Insert new quote
      const { data, error } = await supabase
        .from("trade_in_quotes")
        .insert({
          quote_id: quoteId,
          user_id: user?.id || null,
          vehicle_year: vehicleYear,
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
          vehicle_trim: vehicleTrim,
          mileage: mileage ? parseInt(mileage) : null,
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

      if (error) throw error
      savedQuote = data
    }

    // TODO: In production, send notifications here:
    // 1. Send email to customer confirming acceptance
    // 2. Send SMS to customer
    // 3. Notify dealership team via email/Slack
    // 
    // Example:
    // await sendEmail({
    //   to: customerEmail,
    //   subject: `Trade-In Offer Accepted - Quote #${quoteId}`,
    //   template: 'trade-in-accepted',
    //   data: { quoteId, vehicle: `${vehicleYear} ${vehicleMake} ${vehicleModel}`, offerAmount }
    // })
    //
    // await sendSMS({
    //   to: customerPhone,
    //   message: `Planet Motors: Your trade-in offer of $${offerAmount.toLocaleString()} has been accepted! We'll contact you within 2 hours. Quote #${quoteId}`
    // })
    //
    // await notifyDealership({
    //   type: 'trade-in-accepted',
    //   quoteId,
    //   customerName,
    //   customerEmail,
    //   customerPhone,
    //   vehicle: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
    //   offerAmount
    // })

    return NextResponse.json({
      success: true,
      message: "Offer accepted! You will receive confirmation via email and SMS.",
      data: {
        quoteId: savedQuote.quote_id,
        status: savedQuote.status,
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
