import { generateText } from "ai"
import { gateway } from "@ai-sdk/gateway"
import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedAdmin } from "@/lib/api/auth-helpers"

type ContentType = "listing" | "social" | "ad"

const CONTENT_TYPE_PROMPTS: Record<ContentType, string> = {
  listing: `Write a compelling vehicle listing description for a dealership website.
The description should be 3-4 paragraphs, highlighting key features, condition, and value proposition.
Use professional but approachable language. Mention trust signals like inspection, clean history, and warranty.
Do NOT include the price or mileage numbers — those are shown separately on the page.
End with a soft call-to-action.`,
  social: `Write 3 social media post variations for this vehicle (Facebook/Instagram).
Each post should be 2-3 sentences max, engaging, and include relevant emojis.
Include hashtag suggestions at the end of each post.
Format as Post 1:, Post 2:, Post 3:`,
  ad: `Write Google/Facebook ad copy for this vehicle.
Include:
- A punchy headline (max 30 characters)
- A description line 1 (max 90 characters)
- A description line 2 (max 90 characters)
- A display URL path suggestion
Format clearly with labels.`,
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin()
    if (admin.error) return admin.error

    const body = await request.json()
    const { vehicle, contentType = "listing", customPrompt } = body

    if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) {
      return NextResponse.json({ error: "Vehicle data required (year, make, model)" }, { status: 400 })
    }

    const validTypes: ContentType[] = ["listing", "social", "ad"]
    if (!validTypes.includes(contentType)) {
      return NextResponse.json({ error: "Invalid contentType. Use: listing, social, ad" }, { status: 400 })
    }

    const vehicleInfo = [
      `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`,
      vehicle.body_style ? `Body: ${vehicle.body_style}` : null,
      vehicle.exterior_color ? `Exterior: ${vehicle.exterior_color}` : null,
      vehicle.interior_color ? `Interior: ${vehicle.interior_color}` : null,
      vehicle.engine ? `Engine: ${vehicle.engine}` : null,
      vehicle.transmission ? `Transmission: ${vehicle.transmission}` : null,
      vehicle.drivetrain ? `Drivetrain: ${vehicle.drivetrain}` : null,
      vehicle.fuel_type ? `Fuel: ${vehicle.fuel_type}` : null,
      vehicle.mileage ? `Mileage: ${vehicle.mileage.toLocaleString()} km` : null,
      vehicle.is_ev ? "This is an electric vehicle (EV)" : null,
      vehicle.battery_capacity_kwh ? `Battery: ${vehicle.battery_capacity_kwh} kWh` : null,
      vehicle.ev_battery_health_percent ? `Battery Health: ${vehicle.ev_battery_health_percent}%` : null,
    ].filter(Boolean).join("\n")

    const typePrompt = CONTENT_TYPE_PROMPTS[contentType as ContentType]
    const systemPrompt = `You are a professional automotive copywriter for Planet Motors, a trusted Canadian dealership specializing in certified pre-owned vehicles and EVs. The dealership is known for:
- Aviloo battery certification for EVs
- 210-point inspection on every vehicle
- Clean Carfax / accident-free inventory
- 10-day money-back guarantee
- Canada-wide delivery
- Zero-pressure sales approach

${typePrompt}
${customPrompt ? `\nAdditional instructions: ${customPrompt}` : ""}`

    const { text } = await generateText({
      model: gateway("openai/gpt-4o-mini"),
      system: systemPrompt,
      prompt: `Generate content for this vehicle:\n\n${vehicleInfo}`,
      temperature: 0.7,
    })

    return NextResponse.json({
      content: text,
      contentType,
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    })
  } catch (error) {
    console.error("AI Writer error:", error)
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
  }
}
