import { generateText } from "ai"
import { gateway } from "@ai-sdk/gateway"
import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedAdmin } from "@/lib/api/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin()
    if (admin.error) return admin.error

    const body = await request.json()
    const { vehicle, mode = "single" } = body

    if (!vehicle && mode === "single") {
      return NextResponse.json({ error: "Vehicle data required" }, { status: 400 })
    }

    const vehicles = mode === "batch" ? body.vehicles : [vehicle]
    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ error: "At least one vehicle required" }, { status: 400 })
    }

    const results = []
    for (const v of vehicles.slice(0, 20)) {
      const vehicleInfo = [
        `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}`,
        v.body_style ? `Body: ${v.body_style}` : null,
        v.mileage ? `${v.mileage.toLocaleString()} km` : null,
        v.price ? `$${v.price.toLocaleString()} CAD` : null,
        v.fuel_type ? `Fuel: ${v.fuel_type}` : null,
        v.is_ev ? "Electric Vehicle" : null,
        v.exterior_color ? `Color: ${v.exterior_color}` : null,
        v.drivetrain ? `Drivetrain: ${v.drivetrain}` : null,
        v.ev_battery_health_percent ? `Battery Health: ${v.ev_battery_health_percent}%` : null,
      ].filter(Boolean).join(", ")

      const { text } = await generateText({
        model: gateway("openai/gpt-4o-mini"),
        system: `You are an SEO specialist for Planet Motors, a Canadian dealership selling certified pre-owned vehicles and EVs.
Generate SEO metadata for a vehicle listing page. Respond ONLY with valid JSON (no markdown):
{
  "metaTitle": "string (max 60 chars, include year make model, and a value keyword)",
  "metaDescription": "string (max 155 chars, include key specs, trust signals like 'Aviloo certified' or '210-point inspected', and a CTA)",
  "ogTitle": "string (max 60 chars, optimized for social sharing)",
  "ogDescription": "string (max 110 chars, social-friendly with emoji)",
  "keywords": ["array", "of", "5-8", "relevant", "long-tail", "keywords"],
  "structuredDataSnippet": "string (a 1-sentence rich snippet for Google)"
}
Rules:
- metaTitle MUST be under 60 characters
- metaDescription MUST be under 155 characters
- Include "Planet Motors" in metaTitle
- For EVs, emphasize battery health and range
- Use action words: "Buy", "Shop", "Get", "Save"`,
        prompt: `Generate SEO metadata for: ${vehicleInfo}`,
        temperature: 0.4,
      })

      try {
        const cleaned = text.replaceAll(/```json\n?|\n?```/g, "").trim()
        const seoData = JSON.parse(cleaned)
        results.push({ vehicleId: v.id, vehicle: `${v.year} ${v.make} ${v.model}`, seo: seoData })
      } catch {
        results.push({ vehicleId: v.id, vehicle: `${v.year} ${v.make} ${v.model}`, seo: null, error: "Failed to parse AI response" })
      }
    }

    if (mode === "single") return NextResponse.json(results[0])
    return NextResponse.json({ results, processed: results.length })
  } catch (error) {
    console.error("AI SEO error:", error)
    return NextResponse.json({ error: "Failed to generate SEO metadata" }, { status: 500 })
  }
}
