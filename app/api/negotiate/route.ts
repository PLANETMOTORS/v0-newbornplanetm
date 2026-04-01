import { streamText, Output } from "ai"
import { z } from "zod"

export async function POST(req: Request) {
  const { vehicleId, vehiclePrice, customerOffer, customerMessage, vehicleInfo } = await req.json()

  const offerPercentage = (customerOffer / vehiclePrice) * 100
  const daysListed = vehicleInfo?.daysListed || 30
  const isHotSeller = vehicleInfo?.viewsLastWeek > 50

  // System prompt for AI negotiator
  const systemPrompt = `You are a friendly but firm AI sales negotiator for Planet Motors, a trusted EV dealership in Richmond Hill, Ontario.

VEHICLE CONTEXT:
- Vehicle: ${vehicleInfo?.name || "Vehicle"}
- Listed Price: $${vehiclePrice.toLocaleString()} CAD
- Customer Offer: $${customerOffer.toLocaleString()} CAD (${offerPercentage.toFixed(1)}% of list price)
- Days on lot: ${daysListed}
- Hot seller: ${isHotSeller ? "Yes" : "No"}

NEGOTIATION RULES:
1. Never accept offers below 85% of list price on first counter
2. If offer is 90%+, you can accept or counter slightly higher
3. If vehicle has been listed 60+ days, be more flexible (can go to 88%)
4. Hot sellers have less room for negotiation
5. Always highlight value: warranty, certification, free delivery in Ontario
6. Be conversational and warm, not robotic
7. If offer is way too low (<75%), politely decline and explain fair market value
8. Maximum 3 counter-offers before suggesting they speak to a human

RESPONSE FORMAT:
- Keep responses under 150 words
- Always provide a counter-offer amount if not accepting
- End with a question to keep conversation going`

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
