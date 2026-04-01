import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

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

    // Check if quote already exists
    const { data: existingQuote } = await supabase
      .from("trade_in_quotes")
      .select("id")
      .eq("quote_id", quoteId)
      .single()

    if (existingQuote) {
      // Update existing quote with user_id
      const { data, error } = await supabase
        .from("trade_in_quotes")
        .update({
          user_id: user.id,
          status: "applied_to_purchase",
          updated_at: new Date().toISOString(),
        })
        .eq("quote_id", quoteId)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: "Trade-in quote linked to your account",
        data,
      })
    }

    // Insert new quote
    const { data, error } = await supabase
      .from("trade_in_quotes")
      .insert({
        quote_id: quoteId,
        user_id: user.id,
        vehicle_year: vehicleYear,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_trim: vehicleTrim,
        mileage: mileage ? parseInt(mileage) : null,
        condition,
        postal_code: postalCode,
        vin,
        customer_name: customerName,
        customer_email: customerEmail || user.email,
        customer_phone: customerPhone,
        offer_amount: offerAmount,
        offer_low: offerLow,
        offer_high: offerHigh,
        status: "applied_to_purchase",
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Trade-in quote saved to your account",
      data,
    })

  } catch (error) {
    console.error("Error saving trade-in quote:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save trade-in quote" },
      { status: 500 }
    )
  }
}

// Get user's trade-in quotes
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from("trade_in_quotes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })

  } catch (error) {
    console.error("Error fetching trade-in quotes:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch trade-in quotes" },
      { status: 500 }
    )
  }
}
