import { NextRequest, NextResponse } from "next/server"
import { streamText, Output } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/redis"
import { getAISettings } from "@/lib/sanity/fetch"

// POST /api/negotiate - AI price negotiation (authenticated, DB-backed pricing)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit: 5 negotiations per hour per user
    const clientIp = req.headers.get("x-forwarded-for") || "unknown"
    const rateLimitResult = await rateLimit(`negotiate:${user.id}:${clientIp}`, 5, 3600)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many negotiation requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { vehicleId, customerOffer, customerMessage } = body

    // Validate required fields
    if (!vehicleId) {
      return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 })
    }

    if (!Number.isFinite(customerOffer) || customerOffer <= 0) {
      return NextResponse.json(
        { error: "Customer offer must be a positive number" },
        { status: 400 }
      )
    }

    if (customerOffer > 1_000_000) {
      return NextResponse.json(
        { error: "Customer offer exceeds reasonable bounds" },
        { status: 400 }
      )
    }

    // CRITICAL: Load authoritative vehicle from DB (not client-supplied price)
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, listing_price_cents, year, make, model, status, days_listed")
      .eq("id", vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    // Ensure vehicle is active for sale
    if (vehicle.status !== "active" && vehicle.status !== "available") {
      return NextResponse.json(
        { error: "This vehicle is not available for negotiation" },
        { status: 400 }
      )
    }

    // Use authoritative DB price (not client-supplied)
    const vehiclePrice = vehicle.listing_price_cents / 100
    const daysListed = vehicle.days_listed || 30

    // Validate customer offer is within reasonable bounds relative to DB price
    if (customerOffer > vehiclePrice * 1.5) {
      return NextResponse.json(
        { error: "Offer cannot exceed 150% of listing price" },
        { status: 400 }
      )
    }

    // Fetch AI settings from CMS
    const aiSettings = await getAISettings()
    const rules = aiSettings?.priceNegotiator?.negotiationRules
    const fees = aiSettings?.fees

    // Calculate max discount based on CMS rules
    const isLowPrice = vehiclePrice < (rules?.lowPriceThreshold || 30000)
    let maxDiscountPercent: number

    if (isLowPrice) {
      if (daysListed <= 31) {
        maxDiscountPercent = rules?.lowPriceMaxDiscount_0_31days || 1
      } else if (daysListed <= 46) {
        maxDiscountPercent = rules?.lowPriceMaxDiscount_32_46days || 1.25
      } else {
        maxDiscountPercent = rules?.lowPriceMaxDiscount_47plus || 1.5
      }
    } else {
      if (daysListed <= 46) {
        maxDiscountPercent = rules?.highPriceMaxDiscount_0_46days || 0.75
      } else {
        maxDiscountPercent = rules?.highPriceMaxDiscount_47plus || 1
      }
    }

    const minAcceptablePrice = vehiclePrice * (1 - maxDiscountPercent / 100)

    // CRITICAL: Determine if offer should be ACCEPTED
    const offerIsAcceptable = customerOffer >= minAcceptablePrice
    const offerIsClose = customerOffer >= minAcceptablePrice * 0.98
    const suggestedCounterOffer = Math.round(minAcceptablePrice)

    // Bounded counter offer range for LLM: between customer offer (- 5%) and list price (+ 5%)
    const minCounterBound = Math.round(Math.max(customerOffer * 0.95, minAcceptablePrice))
    const maxCounterBound = Math.round(vehiclePrice * 1.05)

    // Build decision instruction
    let decisionInstruction: string
    if (offerIsAcceptable) {
      decisionInstruction = `
**ACCEPT THIS OFFER IMMEDIATELY**
Customer offered $${customerOffer.toLocaleString()} which is AT OR ABOVE your minimum of $${minAcceptablePrice.toLocaleString()}.
- Set status to "accepted"
- Set counterOffer to null
- Congratulate them: "Fantastic! I'm happy to accept your offer of $${customerOffer.toLocaleString()}!"
- Mention next steps (paperwork, delivery options)
DO NOT counter-offer. DO NOT ask for more money. ACCEPT THE DEAL.`
    } else if (offerIsClose) {
      decisionInstruction = `
**COUNTER AT MINIMUM PRICE**
Customer offered $${customerOffer.toLocaleString()} which is close but below minimum.
- Set status to "negotiating"
- Set counterOffer to ${suggestedCounterOffer}
- Say you can meet them at $${suggestedCounterOffer.toLocaleString()}`
    } else {
      decisionInstruction = `
**COUNTER HIGHER**
Customer offered $${customerOffer.toLocaleString()} which is too low.
- Set status to "negotiating"
- Set counterOffer to ${Math.round(suggestedCounterOffer * 1.01)} (between $${minCounterBound} and $${maxCounterBound})
- Explain the value they're getting`
    }

    const systemPrompt = `You are a friendly AI sales negotiator for Planet Motors dealership.

VEHICLE: ${vehicle.year} ${vehicle.make} ${vehicle.model} - Listed at $${vehiclePrice.toLocaleString()} CAD
CUSTOMER OFFER: $${customerOffer.toLocaleString()} CAD
MINIMUM ACCEPTABLE: $${minAcceptablePrice.toLocaleString()} CAD (${maxDiscountPercent}% max discount)
COUNTER OFFER BOUNDS: $${minCounterBound}–$${maxCounterBound} (never outside this range)
DAYS ON LOT: ${daysListed}

${decisionInstruction}

CRITICAL RULES:
- NEVER counter above $${maxCounterBound}
- NEVER counter below $${minCounterBound}
- If accepting, counterOffer MUST be null
- Be warm and conversational

FEES TO MENTION: Certification $${fees?.certification || 595}, Doc $${fees?.financeDocFee || 895}, OMVIC $${fees?.omvic || 22}
VALUE: 210-point inspection, 10-day guarantee, free delivery 300km, financing from ${aiSettings?.financing?.lowestRate || 4.79}%`

    // Bounded schema: counterOffer must be null or within explicit min/max bounds
    const result = streamText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: customerMessage || `I'd like to offer $${customerOffer.toLocaleString()} for this vehicle.`,
        },
      ],
      output: Output.object({
        schema: z.object({
          response: z.string().describe("Your response message"),
          counterOffer: z
            .number()
            .nullable()
            .refine(
              (val) =>
                val === null ||
                (Number.isFinite(val) && val >= minCounterBound && val <= maxCounterBound),
              {
                message: `Counter offer must be null or between $${minCounterBound} and $${maxCounterBound}`,
              }
            )
            .describe(
              offerIsAcceptable
                ? "MUST BE null - you are accepting their offer"
                : `Your counter offer - must be between $${minCounterBound} and $${maxCounterBound}`
            ),
          status: z
            .enum(["negotiating", "accepted", "declined", "escalate"])
            .refine((val) => (offerIsAcceptable ? val === "accepted" : val !== "accepted"), {
              message: offerIsAcceptable
                ? 'Status must be "accepted" when offer is acceptable'
                : 'Status cannot be "accepted" when offer is below minimum',
            })
            .describe(offerIsAcceptable ? "MUST BE 'accepted'" : "'negotiating'"),
          confidence: z.number().min(0).max(100),
        }),
      }),
    })

    // Stream response + capture for audit logging
    const streamResponse = result.toUIMessageStreamResponse()

    // Audit trail: log negotiation (fire-and-forget)
    ;(async () => {
      try {
        await supabase.from("negotiation_audits").insert({
          user_id: user.id,
          vehicle_id: vehicleId,
          listing_price_cents: vehicle.listing_price_cents,
          customer_offer_cents: Math.round(customerOffer * 100),
          min_acceptable_cents: Math.round(minAcceptablePrice * 100),
          client_ip: clientIp,
          created_at: new Date().toISOString(),
        })
      } catch (err) {
        console.warn("[audit] Failed to log negotiation", err)
      }
    })()

    return streamResponse
  } catch (err) {
    console.error("[negotiate] Unexpected error:", err)
    return NextResponse.json(
      { error: "Failed to process negotiation request" },
      { status: 500 }
    )
  }
}
