import { streamText, Output } from "ai"
import { z } from "zod"
import { getAISettings } from "@/lib/sanity/fetch"

export async function POST(req: Request) {
  const { vehicleId, vehiclePrice, customerOffer, customerMessage, vehicleInfo } = await req.json()

  // Fetch AI settings from CMS
  const aiSettings = await getAISettings()
  const rules = aiSettings?.priceNegotiator?.negotiationRules
  const fees = aiSettings?.fees

  const offerPercentage = (customerOffer / vehiclePrice) * 100
  const daysListed = vehicleInfo?.daysListed || 30
  const isHotSeller = vehicleInfo?.viewsLastWeek > 50
  
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
  const minAcceptablePercent = 100 - maxDiscountPercent

  // System prompt for AI negotiator with CMS-driven rules
  const systemPrompt = `You are a friendly but firm AI sales negotiator for Planet Motors, a trusted dealership in Richmond Hill, Ontario.

VEHICLE CONTEXT:
- Vehicle: ${vehicleInfo?.name || "Vehicle"}
- Listed Price: $${vehiclePrice.toLocaleString()} CAD
- Customer Offer: $${customerOffer.toLocaleString()} CAD (${offerPercentage.toFixed(1)}% of list price)
- Days on lot: ${daysListed}
- Hot seller: ${isHotSeller ? "Yes" : "No"}
- Price category: ${isLowPrice ? "Standard" : "Premium"} (threshold: $${(rules?.lowPriceThreshold || 30000).toLocaleString()})

NEGOTIATION RULES (from management):
1. Maximum discount allowed: ${maxDiscountPercent}% off list price
2. Minimum acceptable price: $${minAcceptablePrice.toLocaleString()} (${minAcceptablePercent.toFixed(1)}% of list)
3. If offer is at or above ${minAcceptablePercent.toFixed(1)}%, you CAN ACCEPT
4. If offer is close (within 2% of minimum), counter at the minimum
5. If offer is too low, counter at 1-2% above your minimum
6. Hot sellers have less room - stick closer to list price

MANDATORY FEES (inform customer these apply on top of price):
- Certification: $${fees?.certification || 595}
- Documentation: $${fees?.financeDocFee || 895}
- OMVIC: $${fees?.omvic || 22}
- Licensing: $${fees?.licensing || 59}

VALUE HIGHLIGHTS:
- 210-point inspection included
- 10-day/500km money-back guarantee
- Free delivery within 300km
- 20+ lender financing network
- Best rate from ${aiSettings?.financing?.lowestRate || 4.79}%

RESPONSE GUIDELINES:
- Be conversational and warm, not robotic
- Keep responses under 150 words
- Always provide a counter-offer amount if not accepting
- End with a question to keep conversation going
- Maximum 3 counter-offers before suggesting they speak to a human`

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
        response: z.string().describe("The negotiation response message"),
        counterOffer: z.number().nullable().describe("Counter offer amount in dollars, or null if accepting"),
        status: z.enum(["negotiating", "accepted", "declined", "escalate"]).describe("Current negotiation status"),
        confidence: z.number().min(0).max(100).describe("AI confidence in this response"),
      }),
    }),
  })

  return result.toUIMessageStreamResponse()
}
