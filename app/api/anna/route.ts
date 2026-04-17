import { streamText, convertToModelMessages, UIMessage, consumeStream } from "ai"
import { gateway } from "@ai-sdk/gateway"
import { NextResponse } from "next/server"
import { getAISettings, getSiteSettings } from "@/lib/sanity/fetch"
import { rateLimit } from "@/lib/redis"
import { PROVINCE_TAX_RATES } from "@/lib/tax/canada"

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
function isWithinBusinessHours(): { isOpen: boolean; currentDay: string; message: string } {
  const now = new Date()
  const eastern = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Toronto',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).formatToParts(now)
  
  const day = eastern.find(p => p.type === 'weekday')?.value || ''
  const hour = parseInt(eastern.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(eastern.find(p => p.type === 'minute')?.value || '0')
  const currentTime = hour + minute / 60
  
  if (day === 'Sunday') {
    return { isOpen: false, currentDay: day, message: "We're closed on Sundays. We reopen Monday at 9:00 AM." }
  }
  
  if (day === 'Saturday') {
    if (currentTime >= 10 && currentTime < 17) {
      return { isOpen: true, currentDay: day, message: "We're open until 5:00 PM today." }
    }
    return { isOpen: false, currentDay: day, message: "We're closed. Saturday hours are 10:00 AM - 5:00 PM." }
  }
  
  if (currentTime >= 9 && currentTime < 19) {
    return { isOpen: true, currentDay: day, message: "We're open until 7:00 PM today." }
  }
  return { isOpen: false, currentDay: day, message: "We're closed. We're open Monday-Friday 9:00 AM - 7:00 PM." }
}

// Finance calculator - PMT formula
function calculatePayment(principal: number, annualRate: number, termMonths: number): number {
  const monthlyRate = annualRate / 100 / 12
  if (monthlyRate === 0) return principal / termMonths
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1)
}

// Generate payment table for all terms (24-96 months)
function generatePaymentTable(vehiclePrice: number, rate: number = 6.29): string {
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

  const { messages, vehicleContext }: { messages: UIMessage[]; vehicleContext?: VehicleContext } = await req.json()

  const aiSettings: AISettings | null = await getAISettings()
  const siteSettings = await getSiteSettings()
  const anna = aiSettings?.annaAssistant
  const fees = aiSettings?.fees
  const financing = aiSettings?.financing
  
  const businessStatus = isWithinBusinessHours()
  const baseRate = 6.29
  const vehiclePrice = vehicleContext?.price || 35000
  const paymentTable = generatePaymentTable(vehiclePrice, baseRate)

  const systemPrompt = `You are ${anna?.displayName || "Anna"}, Planet Motors' friendly AI assistant.

YOUR PERSONALITY:
- Warm, helpful, and professional
- Expert at calculating and explaining financing options
- Knowledgeable about trade-ins and the car buying process
- Never pushy, always informative

WELCOME MESSAGE (use on first interaction):
${anna?.welcomeMessage || "Hi! I'm Anna from Planet Motors. How can I help you today?"}

QUICK ACTIONS YOU CAN HELP WITH:
${anna?.quickActions?.map((qa: QuickAction) => `- ${qa.label}: ${qa.prompt}`).join('\n') || '- Calculate payments\n- Get trade value\n- Book test drive\n- Find a car'}

=============================================
DEALERSHIP INFORMATION:
=============================================
- Name: ${siteSettings?.dealerName || 'Planet Motors'}
- Address: ${siteSettings?.streetAddress || '30 Major Mackenzie Dr E'}, ${siteSettings?.city || 'Richmond Hill'}, ${siteSettings?.province || 'Ontario'} ${siteSettings?.postalCode || 'L4C 1G7'}
- Phone: ${siteSettings?.phone || '1-866-797-3332'}
- Secondary Phone: ${siteSettings?.phoneSecondary || '416-985-2277'}
- Email: ${siteSettings?.email || 'info@planetmotors.ca'}
- Google Maps: ${siteSettings?.googleMapsUrl || 'https://maps.google.com/?q=30+Major+Mackenzie+E+Richmond+Hill'}
- Rating: ${siteSettings?.ratingDisplay?.ratingValue || '4.9'}/5 (${siteSettings?.ratingDisplay?.reviewCount || '500'}+ reviews)
- OMVIC Licensed: ${siteSettings?.omvicNumber || 'Yes'}

=============================================
BUSINESS HOURS:
=============================================
- Monday - Friday: 9:00 AM - 7:00 PM
- Saturday: 10:00 AM - 5:00 PM  
- Sunday: Closed

CURRENT STATUS: ${businessStatus.message}
Today is ${businessStatus.currentDay}. We are currently ${businessStatus.isOpen ? 'OPEN' : 'CLOSED'}.

=============================================
TEST DRIVE SCHEDULING:
=============================================
${businessStatus.isOpen ? `
YES - You CAN schedule test drives right now!
- Ask for their preferred date and time within business hours
- Get their name and phone number
- Confirm which vehicle they want to test drive
- Tell them: "I've noted your test drive request for [vehicle] on [date/time]. Our team will call you at [phone] to confirm."
` : `
Currently CLOSED - Take their info for callback:
- Get their name and phone number
- Get preferred date/time for test drive
- Note which vehicle they're interested in
- Tell them: "We're currently closed, but I've noted your request. Our team will call you when we reopen to confirm your test drive."
`}

=============================================
INVENTORY VIEWING:
=============================================
You CAN help customers browse available inventory anytime!
- Direct them to: planetmotors.ca/inventory
- Help filter by: type (SUV, Sedan, Electric, Luxury), price range, make, model
- Quick filters: SUV, Sedan, Electric, Luxury, Under $20k

Example responses:
- "You can browse our available inventory at planetmotors.ca/inventory"
- "Looking for an SUV? Check out planetmotors.ca/inventory?type=suv"
- "We have great options under $20k at planetmotors.ca/inventory?maxPrice=20000"

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

EXAMPLE ($35,000 at ${baseRate}%):
• 24 mo: $1,553/mo | $717/bi-wk | $358/wk
• 36 mo: $1,069/mo | $493/bi-wk | $247/wk
• 48 mo: $824/mo | $380/bi-wk | $190/wk
• 60 mo: $681/mo | $314/bi-wk | $157/wk
• 72 mo: $580/mo | $268/bi-wk | $134/wk
• 84 mo: $508/mo | $234/bi-wk | $117/wk
• 96 mo: $454/mo | $209/bi-wk | $105/wk

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

${vehicleContext ? `
CURRENT VEHICLE:
- Name: ${vehicleContext.name}
- Price: $${vehicleContext.price?.toLocaleString()}
- Year: ${vehicleContext.year}
- Mileage: ${vehicleContext.mileage?.toLocaleString()} km
` : ''}

RESPONSE GUIDELINES:
1. For payment questions - show all terms (24-96 months) with bi-weekly and weekly
2. Always mention "rates from ${baseRate}%, subject to credit approval"
3. Keep responses concise (2-3 sentences for non-payment questions)
4. Always offer to help with next steps`

  // AI SDK 6: Convert UIMessage format to ModelMessage format
  const result = streamText({
    model: gateway("openai/gpt-4o-mini"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  })

  // AI SDK 6: Use toUIMessageStreamResponse instead of toDataStreamResponse
  return result.toUIMessageStreamResponse({
    consumeSseStream: consumeStream,
  })
}
