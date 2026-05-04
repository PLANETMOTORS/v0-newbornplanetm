import { streamText, convertToModelMessages, UIMessage, consumeStream, tool, stepCountIs } from "ai"
import { gateway } from "@ai-sdk/gateway"
import { NextResponse } from "next/server"

export const maxDuration = 60 // 1 minute — AI chatbot with multi-step tool calls
import { getAISettings, getSiteSettings } from "@/lib/sanity/fetch"
import { rateLimit } from "@/lib/redis"
import { PROVINCE_TAX_RATES } from "@/lib/tax/canada"
import { RATE_FLOOR } from "@/lib/rates"
import { z } from "zod"
import { searchInventory, formatVehiclesForAnna, buildInventoryContext } from "@/lib/anna/inventory-search"
import { createLead, saveConversation, saveChatMessage, escalateConversation } from "@/lib/anna/lead-capture"
import { buildKnowledgePrompt } from "@/lib/anna/knowledge"
import {
  DEALERSHIP_TIMEZONE,
  WEEKDAY_OPEN, WEEKDAY_CLOSE,
  SATURDAY_OPEN, SATURDAY_CLOSE,
  WEEKDAY_HOURS_LONG, SATURDAY_HOURS_LONG,
  PHONE_TOLL_FREE, PHONE_LOCAL, EMAIL_INFO, DEALERSHIP_LOCATION,
} from "@/lib/constants/dealership"

// Allowed origins for the AI assistant endpoint — use exact origin matching
// to prevent bypass via domains like "https://www.planetmotors.ca.attacker.tld"
const ALLOWED_ORIGINS = new Set(
  [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    "https://planetmotors.ca",
    "https://www.planetmotors.ca",
    "https://ev.planetmotors.ca",
  ].flatMap((value) => {
    if (typeof value !== "string" || value.length === 0) return []
    try {
      return [new URL(value).origin]
    } catch {
      return []
    }
  })
)

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") return true

  if (origin) {
    try {
      if (ALLOWED_ORIGINS.has(new URL(origin).origin)) return true
    } catch { /* malformed origin header */ }
  }

  if (referer) {
    try {
      if (ALLOWED_ORIGINS.has(new URL(referer).origin)) return true
    } catch { /* malformed referer header */ }
  }

  return false
}

// Types for AI settings from Sanity CMS
interface QuickAction {
  label: string
  prompt: string
}

interface AnnaAssistant {
  displayName?: string
  welcomeMessage?: string
  quickActions?: QuickAction[]
}

interface AIFees {
  certification?: number
  financeDocFee?: number
  omvic?: number
  licensing?: number
}

interface AIFinancing {
  lowestRate?: number
  numberOfLenders?: number
  terms?: number[]
  paymentFrequencies?: string[]
}

interface AISettings {
  annaAssistant?: AnnaAssistant
  priceNegotiator?: {
    negotiationRules?: Record<string, unknown>
  }
  fees?: AIFees
  financing?: AIFinancing
}

interface VehicleContext {
  name?: string
  price?: number
  year?: number
  mileage?: number
}

// Check if current time is within business hours (Eastern Time)
// Hours imported from central config — lib/constants/dealership.ts
function isWithinBusinessHours(): { isOpen: boolean; currentDay: string; message: string } {
  const now = new Date()
  const eastern = new Intl.DateTimeFormat('en-US', {
    timeZone: DEALERSHIP_TIMEZONE,
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).formatToParts(now)

  const day = eastern.find(p => p.type === 'weekday')?.value || ''
  const hour = Number.parseInt(eastern.find(p => p.type === 'hour')?.value || '0')
  const minute = Number.parseInt(eastern.find(p => p.type === 'minute')?.value || '0')
  const currentTime = hour + minute / 60

  if (day === 'Sunday') {
    return { isOpen: false, currentDay: day, message: `We're closed on Sundays. We reopen Monday at ${WEEKDAY_OPEN}:00 AM.` }
  }

  if (day === 'Saturday') {
    if (currentTime >= SATURDAY_OPEN && currentTime < SATURDAY_CLOSE) {
      return { isOpen: true, currentDay: day, message: `We're open until ${SATURDAY_CLOSE > 12 ? SATURDAY_CLOSE - 12 : SATURDAY_CLOSE}:00 PM today.` }
    }
    return { isOpen: false, currentDay: day, message: `We're closed. Saturday hours are ${SATURDAY_HOURS_LONG}.` }
  }

  if (currentTime >= WEEKDAY_OPEN && currentTime < WEEKDAY_CLOSE) {
    return { isOpen: true, currentDay: day, message: `We're open until ${WEEKDAY_CLOSE > 12 ? WEEKDAY_CLOSE - 12 : WEEKDAY_CLOSE}:00 PM today.` }
  }
  return { isOpen: false, currentDay: day, message: `We're closed. We're open Monday-Friday ${WEEKDAY_HOURS_LONG}.` }
}

// Finance calculator - PMT formula
function calculatePayment(principal: number, annualRate: number, termMonths: number): number {
  const monthlyRate = annualRate / 100 / 12
  if (monthlyRate === 0) return principal / termMonths
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1)
}

// Generate payment table for all terms (24-96 months)
function generatePaymentTable(vehiclePrice: number, rate: number = RATE_FLOOR): string {
  const terms = [24, 36, 48, 60, 72, 84, 96]
  let table = `For $${vehiclePrice.toLocaleString()} at ${rate}% APR:\n`
  
  for (const term of terms) {
    const monthly = calculatePayment(vehiclePrice, rate, term)
    const biWeekly = (monthly * 12) / 26
    const weekly = (monthly * 12) / 52
    table += `• ${term} months: $${monthly.toFixed(0)}/mo | $${biWeekly.toFixed(0)}/bi-weekly | $${weekly.toFixed(0)}/weekly\n`
  }
  
  return table
}

export async function POST(req: Request) {
  // Origin/Referer validation
  if (!isAllowedOrigin(req)) {
    return NextResponse.json(
      { error: "Forbidden: invalid origin" },
      { status: 403 }
    )
  }

  // IP-based rate limiting: 20 requests per hour
  const forwarded = req.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0]?.trim() || "unknown"
  const limiter = await rateLimit(`anna:${ip}`, 20, 3600)
  if (!limiter.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  const { messages, vehicleContext, sessionId }: { messages: UIMessage[]; vehicleContext?: VehicleContext; sessionId?: string } = await req.json()

  // Save conversation (non-blocking)
  const conversationSessionId = sessionId || `anon-${ip}-${Date.now()}`
  const conversationPromise = saveConversation({
    sessionId: conversationSessionId,
    vehicleContext: vehicleContext as Record<string, unknown> | undefined,
  })

  // Save user's latest message (non-blocking)
  const latestUserMessage = messages.findLast((m: { role: string }) => m.role === "user")
  if (latestUserMessage) {
    conversationPromise.then(convId => {
      if (convId) {
        const content = latestUserMessage.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map(p => p.text)
          .join("")
        saveChatMessage({ conversationId: convId, role: "user", content })
      }
    })
  }

  const [aiSettings, siteSettings, inventoryContext, knowledgePrompt] = await Promise.all([
    getAISettings(),
    getSiteSettings(),
    buildInventoryContext(),
    buildKnowledgePrompt("anna"),
  ])

  const typedAiSettings = aiSettings as AISettings | null
  const anna = typedAiSettings?.annaAssistant
  const fees = typedAiSettings?.fees
  const financing = typedAiSettings?.financing
  
  const businessStatus = isWithinBusinessHours()
  const baseRate = financing?.lowestRate || RATE_FLOOR
  const vehiclePrice = vehicleContext?.price || 35000
  const paymentTable = generatePaymentTable(vehiclePrice, baseRate)

  const systemPrompt = `You are ${anna?.displayName || "Anna"}, Planet Motors' friendly AI assistant.

YOUR PERSONALITY:
- Warm, helpful, and professional — like a knowledgeable friend who works at the dealership
- Expert at calculating and explaining financing options
- Knowledgeable about trade-ins, the car buying process, and all Planet Motors policies
- Never pushy, always informative
- You know the REAL inventory — you can search and tell customers exactly what's available

WELCOME MESSAGE (use on first interaction):
${anna?.welcomeMessage || "Hi! I'm Anna from Planet Motors. How can I help you today?"}

QUICK ACTIONS YOU CAN HELP WITH:
${anna?.quickActions?.map((qa: QuickAction) => `- ${qa.label}: ${qa.prompt}`).join('\n') || '- Calculate payments\n- Get trade value\n- Book test drive\n- Find a car'}

=============================================
DEALERSHIP INFORMATION:
=============================================
- Name: ${siteSettings?.dealerName || 'Planet Motors'}
- Address: ${siteSettings?.streetAddress || DEALERSHIP_LOCATION.streetAddress}, ${siteSettings?.city || DEALERSHIP_LOCATION.city}, ${siteSettings?.province || DEALERSHIP_LOCATION.province} ${siteSettings?.postalCode || DEALERSHIP_LOCATION.postalCode}
- Phone: ${siteSettings?.phone || PHONE_TOLL_FREE}
- Secondary Phone: ${siteSettings?.phoneSecondary || PHONE_LOCAL}
- Email: ${siteSettings?.email || EMAIL_INFO}
- Website: planetmotors.ca
- Google Maps: ${siteSettings?.googleMapsUrl || 'https://maps.google.com/?q=30+Major+Mackenzie+E+Richmond+Hill'}
- Rating: ${siteSettings?.ratingDisplay?.ratingValue || '4.9'}/5 (${siteSettings?.ratingDisplay?.reviewCount || '500'}+ reviews)
- OMVIC Licensed: ${siteSettings?.omvicNumber || 'Yes'}

=============================================
BUSINESS HOURS:
=============================================
- Monday - Friday: ${WEEKDAY_HOURS_LONG}
- Saturday: ${SATURDAY_HOURS_LONG}
- Sunday: Closed

CURRENT STATUS: ${businessStatus.message}
Today is ${businessStatus.currentDay}. We are currently ${businessStatus.isOpen ? 'OPEN' : 'CLOSED'}.

=============================================
PLANET MOTORS GUARANTEES & POLICIES:
=============================================

PM CERTIFIED™ 210-POINT INSPECTION:
Every vehicle undergoes a rigorous 210-point inspection covering:
- Engine & transmission performance
- Brake system & suspension
- Electrical systems & battery health
- Interior & exterior condition
- Safety features & emissions
- Road test verification
All vehicles come with a detailed inspection report.

10-DAY / 500 KM MONEY-BACK GUARANTEE:
- Drive the vehicle for up to 10 days or 500 km (whichever comes first)
- If you're not 100% satisfied, return it for a full refund
- No questions asked — we want you to love your car
- Vehicle must be returned in the same condition

FREE DELIVERY:
- FREE delivery within 300 km of our dealership
- Nationwide delivery available across Canada
- Delivery fee calculated by postal code (FSA) for distances beyond 300 km
- Enclosed transport available for premium vehicles
- Typical delivery: 3-7 business days depending on distance

FINANCING:
- ${financing?.numberOfLenders || 20}+ partner lenders
- Rates starting from ${baseRate}% APR
- Terms available: 24, 36, 48, 60, 72, 84, 96 months
- Payment options: weekly, bi-weekly, semi-monthly, monthly
- Bad credit? No credit? We can help — we work with all credit situations
- Apply online at planetmotors.ca/finance
- Quick pre-approval in minutes
- All financing is OAC (On Approved Credit)

TRADE-INS:
- Instant online trade-in valuations
- Fair market value based on live Canadian market data
- Trade-in value can be applied as down payment
- Get your estimate at planetmotors.ca/sell-your-car

OMVIC COMPLIANCE:
- Planet Motors is a fully licensed OMVIC dealer
- All prices are OMVIC-compliant all-in advertised prices
- Price includes: OMVIC fee ($${fees?.omvic || 22}), certification ($${fees?.certification || 595}), licensing ($${fees?.licensing || 59})
- HST (13%) is additional as required by law
- No hidden fees — what you see is what you pay

CARFAX REPORTS:
- FREE CARFAX report available for every vehicle
- Full accident history, service records, ownership history
- Available on each vehicle's detail page

=============================================
${inventoryContext}
=============================================

=============================================
TEST DRIVE SCHEDULING:
=============================================
${businessStatus.isOpen ? `
YES - You CAN schedule test drives right now!
- Ask for their preferred date and time within business hours
- Get their name and phone number
- Confirm which vehicle they want to test drive
- Use the capture_lead tool to save their test drive request
- Tell them: "I've noted your test drive request for [vehicle] on [date/time]. Our team will call you at [phone] to confirm."
` : `
Currently CLOSED - Take their info for callback:
- Get their name and phone number
- Get preferred date/time for test drive
- Note which vehicle they're interested in
- Use the capture_lead tool to save their request
- Tell them: "We're currently closed, but I've noted your request. Our team will call you when we reopen to confirm your test drive."
`}

=============================================
INVENTORY SEARCH:
=============================================
You have access to the REAL inventory database. When customers ask about vehicles:
1. Use the search_inventory tool to find matching vehicles
2. Share actual stock numbers, prices, and details
3. Always link to planetmotors.ca/inventory for the full browsing experience
4. If they mention a specific make/model, search for it
5. You can filter by: make, model, body style, price range, EV/hybrid, year

Example: "Let me check what we have... We currently have 3 Tesla Model 3s in stock, starting at $29,900. The lowest mileage one is a 2022 with 28,000 km for $34,500."

=============================================
FINANCE CALCULATOR RULES:
=============================================
Starting Rate: ${baseRate}% APR
Available Terms: 24, 36, 48, 60, 72, 84, 96 months

WHEN ASKED ABOUT PAYMENTS:
1. Calculate using ${baseRate}% APR
2. Show ALL terms from 24 to 96 months
3. Include monthly, bi-weekly, AND weekly options
4. Always say "rates from ${baseRate}%, subject to credit approval"

PAYMENT FORMULA:
Monthly = (Principal × (${baseRate}/12/100) × (1 + ${baseRate}/12/100)^months) / ((1 + ${baseRate}/12/100)^months - 1)
Bi-Weekly = Monthly × 12 / 26
Weekly = Monthly × 12 / 52

CURRENT VEHICLE PAYMENT TABLE:
${paymentTable}

=============================================
PRICING & HST STRUCTURE:
=============================================
HST (${(PROVINCE_TAX_RATES.ON.hst * 100).toFixed(0)}%) is NEVER included - add ${(PROVINCE_TAX_RATES.ON.hst * 100).toFixed(0)}% to EVERYTHING!

VEHICLE PRICE:
- Listed Price does NOT include HST
- Add ${(PROVINCE_TAX_RATES.ON.hst * 100).toFixed(0)}% HST to vehicle price

ALL FEES (add ${(PROVINCE_TAX_RATES.ON.hst * 100).toFixed(0)}% HST to each):
- Finance/Doc Fee: $${fees?.financeDocFee || 895} + HST = $${Math.round((fees?.financeDocFee || 895) * (1 + PROVINCE_TAX_RATES.ON.hst))}
- OMVIC Fee: $${fees?.omvic || 22} + HST = $${Math.round((fees?.omvic || 22) * (1 + PROVINCE_TAX_RATES.ON.hst))}
- Licensing Fee: $${fees?.licensing || 59} + HST = $${Math.round((fees?.licensing || 59) * (1 + PROVINCE_TAX_RATES.ON.hst))}

TOTAL FEES WITH HST: $${Math.round(((fees?.financeDocFee || 895) + (fees?.omvic || 22) + (fees?.licensing || 59)) * (1 + PROVINCE_TAX_RATES.ON.hst))}

OUT-THE-DOOR EXAMPLE ($35,000 vehicle):
- Vehicle: $35,000 + $${Math.round(35000 * PROVINCE_TAX_RATES.ON.hst).toLocaleString()} HST = $${Math.round(35000 * (1 + PROVINCE_TAX_RATES.ON.hst)).toLocaleString()}
- Finance Doc: $895 + $${Math.round(895 * PROVINCE_TAX_RATES.ON.hst)} HST = $${Math.round(895 * (1 + PROVINCE_TAX_RATES.ON.hst))}
- OMVIC: $22 + $${Math.round(22 * PROVINCE_TAX_RATES.ON.hst)} HST = $${Math.round(22 * (1 + PROVINCE_TAX_RATES.ON.hst))}
- Licensing: $59 + $${Math.round(59 * PROVINCE_TAX_RATES.ON.hst)} HST = $${Math.round(59 * (1 + PROVINCE_TAX_RATES.ON.hst))}
- TOTAL: $${Math.round((35000 + 895 + 22 + 59) * (1 + PROVINCE_TAX_RATES.ON.hst)).toLocaleString()}

KEY SELLING POINTS:
- 210-point inspection on every vehicle
- 10-day/500km money-back guarantee
- Free delivery within 300km
- ${financing?.numberOfLenders || 20}+ lenders for best rates
- Free CARFAX report on every vehicle
- OMVIC licensed dealer — no hidden fees

${vehicleContext ? `
CURRENT VEHICLE BEING VIEWED:
- Name: ${vehicleContext.name}
- Price: $${vehicleContext.price?.toLocaleString()}
- Year: ${vehicleContext.year}
- Mileage: ${vehicleContext.mileage?.toLocaleString()} km
` : ''}

=============================================
HUMAN ESCALATION:
=============================================
If a customer:
- Explicitly asks to speak with a person/salesperson/manager
- Has a complex issue you can't resolve
- Is frustrated or unhappy
- Needs to discuss a specific deal or existing order

Use the escalate_to_human tool. Tell them:
"I'd be happy to connect you with our team! I'm saving your conversation so they have full context. ${businessStatus.isOpen ? `Someone will reach out to you shortly — you can also call us directly at ${PHONE_TOLL_FREE}.` : "We're currently closed, but I've flagged your request as priority. Our team will contact you first thing when we reopen."}"

=============================================
LEAD CAPTURE:
=============================================
When a customer shows clear buying intent, use the capture_lead tool:
- They ask about a specific vehicle's availability
- They want to schedule a test drive
- They ask about financing for a specific vehicle
- They provide their contact information
- They want to make an offer

${knowledgePrompt}
RESPONSE GUIDELINES:
1. For payment questions — show all terms (24-96 months) with bi-weekly and weekly
2. Always mention "rates from ${baseRate}%, subject to credit approval"
3. Keep responses concise (2-3 sentences for non-payment questions)
4. Always offer to help with next steps
5. When searching inventory, use the search_inventory tool — don't guess
6. Be specific with real data — stock numbers, exact prices, actual mileage
7. If you don't know something, say so honestly and offer to connect with the team
8. When a customer's question matches a trained Q&A entry, use the trained response — it takes priority`

  // Define tools for Anna
  const annaTools = {
    search_inventory: tool({
      description: "Search Planet Motors' real vehicle inventory. Use this when a customer asks about available vehicles, specific makes/models, price ranges, or vehicle types.",
      inputSchema: z.object({
        make: z.string().optional().describe("Vehicle make (e.g., Tesla, Toyota, BMW)"),
        model: z.string().optional().describe("Vehicle model (e.g., Model 3, RAV4, X5)"),
        bodyStyle: z.string().optional().describe("Body style (e.g., SUV, Sedan, Truck, Coupe)"),
        maxPrice: z.number().optional().describe("Maximum price filter"),
        minPrice: z.number().optional().describe("Minimum price filter"),
        isEv: z.boolean().optional().describe("Filter for electric vehicles only"),
        fuelType: z.string().optional().describe("Fuel type (e.g., Electric, Hybrid, Gasoline)"),
        year: z.number().optional().describe("Specific year filter"),
      }),
      execute: async (params) => {
        const result = await searchInventory(params)
        return formatVehiclesForAnna(result.vehicles, result.totalCount)
      },
    }),

    capture_lead: tool({
      description: "Capture a customer lead when they show buying intent — test drive request, specific vehicle interest, financing inquiry, or provide contact info.",
      inputSchema: z.object({
        customerName: z.string().optional().describe("Customer's name if provided"),
        customerEmail: z.string().optional().describe("Customer's email if provided"),
        customerPhone: z.string().optional().describe("Customer's phone if provided"),
        subject: z.string().describe("Brief description of what the customer wants"),
        vehicleInfo: z.string().optional().describe("Vehicle they're interested in"),
        priority: z.enum(["low", "medium", "high"]).optional().describe("Lead priority"),
      }),
      execute: async (params) => {
        const leadId = await createLead({
          source: "chat",
          ...params,
        })
        return leadId
          ? "Lead captured successfully. The team will follow up."
          : "Lead noted — team will follow up."
      },
    }),

    escalate_to_human: tool({
      description: "Escalate the conversation to a human team member. Use when the customer explicitly requests to speak with a person, has a complex issue, or is unhappy.",
      inputSchema: z.object({
        reason: z.string().describe("Why the customer needs human help"),
        customerName: z.string().optional().describe("Customer's name if known"),
        customerEmail: z.string().optional().describe("Customer's email if known"),
        customerPhone: z.string().optional().describe("Customer's phone if known"),
        vehicleInfo: z.string().optional().describe("Vehicle context if relevant"),
      }),
      execute: async (params) => {
        const convId = await conversationPromise
        await escalateConversation({
          conversationId: convId || undefined,
          sessionId: conversationSessionId,
          ...params,
        })
        return "Escalation created. A team member will reach out."
      },
    }),
  }

  // AI SDK 6: Convert UIMessage format to ModelMessage format
  const result = streamText({
    model: gateway("openai/gpt-4o-mini"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: annaTools,
    stopWhen: stepCountIs(3),
  })

  // Save assistant response (non-blocking — after stream completes)
  void (async () => {
    try {
      const responseText = await result.text
      const convId = await conversationPromise
      if (convId && responseText) {
        saveChatMessage({ conversationId: convId, role: "assistant", content: responseText })
      }
    } catch {
      // Non-critical — don't fail the stream
    }
  })()

  // AI SDK 6: Use toUIMessageStreamResponse instead of toDataStreamResponse
  return result.toUIMessageStreamResponse({
    consumeSseStream: consumeStream,
  })
}
