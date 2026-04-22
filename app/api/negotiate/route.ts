import { streamText, Output } from "ai"
import { gateway } from "@ai-sdk/gateway"
import { z } from "zod"
import { NextResponse } from "next/server"
import { getAISettings } from "@/lib/sanity/fetch"
import { validateOrigin } from "@/lib/csrf"
import { rateLimit } from "@/lib/redis"
import { RATE_FLOOR } from "@/lib/rates"

export async function POST(req: Request) {
  // CSRF origin validation
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: invalid origin" }, { status: 403 })
  }

  // IP-based rate limiting: 10 negotiations per hour per IP
  const forwarded = req.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0]?.trim() || "unknown"
  const limiter = await rateLimit(`negotiate:${ip}`, 10, 3600)
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  const { vehiclePrice, customerOffer, customerMessage, vehicleInfo } = await req.json()

  // Fetch AI settings from CMS
  const aiSettings = await getAISettings()
  const rules = aiSettings?.priceNegotiator?.negotiationRules
  const fees = aiSettings?.fees

  const daysListed = vehicleInfo?.daysListed || 30
  
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
  const offerIsClose = customerOffer >= (minAcceptablePrice * 0.98)
  const suggestedCounterOffer = Math.round(minAcceptablePrice)

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
- Set counterOffer to ${Math.round(suggestedCounterOffer * 1.01)} or ${Math.round(suggestedCounterOffer * 1.02)}
- Explain the value they're getting`
  }

  const systemPrompt = `You are a friendly AI sales negotiator for Planet Motors dealership.

VEHICLE: ${vehicleInfo?.name || "Vehicle"} - Listed at $${vehiclePrice.toLocaleString()} CAD
CUSTOMER OFFER: $${customerOffer.toLocaleString()} CAD
MINIMUM ACCEPTABLE: $${minAcceptablePrice.toLocaleString()} CAD (${maxDiscountPercent}% max discount)
DAYS ON LOT: ${daysListed}

${decisionInstruction}

RULES:
- NEVER counter above listed price ($${vehiclePrice.toLocaleString()})
- NEVER counter below customer's offer ($${customerOffer.toLocaleString()})
- If accepting, counterOffer MUST be null
- Be warm and conversational

FEES TO MENTION: Certification $${fees?.certification || 595}, Doc $${fees?.financeDocFee || 895}, OMVIC $${fees?.omvic || 22}
VALUE: 210-point inspection, 10-day guarantee, free delivery 300km, financing from ${aiSettings?.financing?.lowestRate || RATE_FLOOR}%`

  const result = streamText({
    model: gateway("openai/gpt-4o-mini"),
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
        counterOffer: z.number().nullable().describe(
          offerIsAcceptable 
            ? "MUST BE null - you are accepting their offer" 
            : `Your counter offer - around $${suggestedCounterOffer}`
        ),
        status: z.enum(["negotiating", "accepted", "declined", "escalate"]).describe(
          offerIsAcceptable 
            ? "MUST BE 'accepted'" 
            : "'negotiating'"
        ),
        confidence: z.number().min(0).max(100),
      }),
    }),
  })

  return result.toUIMessageStreamResponse()
}
