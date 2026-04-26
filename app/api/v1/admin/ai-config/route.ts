import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { ADMIN_EMAILS } from "@/lib/admin"

/** Create a Supabase service-role client using env vars. */
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  )
}

// GET — fetch all AI agent configs
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createServiceClient()

    const { data: configs, error } = await adminClient
      .from("ai_agent_config")
      .select("*")
      .order("agent_type")

    if (error && (error.message?.includes("does not exist") || error.message?.includes("Could not find") || error.code === "PGRST205")) {
      // Table not created yet — return defaults
      return NextResponse.json({
        agents: [
          {
            agent_type: "anna",
            display_name: "Anna",
            is_active: true,
            system_prompt: null,
            welcome_message: "Hi! I'm Anna from Planet Motors. How can I help you today?",
            quick_actions: [
              { label: "Calculate Payment", prompt: "Help me calculate monthly payments" },
              { label: "Get Trade Value", prompt: "What's my car worth?" },
              { label: "Book Test Drive", prompt: "I want to schedule a test drive" },
              { label: "Find a Car", prompt: "Help me find my perfect car" },
            ],
            config: { model: "gpt-4o-mini", temperature: 0.7, maxTokens: 1000, rateLimit: 20 },
          },
          {
            agent_type: "negotiator",
            display_name: "Price Negotiator",
            is_active: true,
            system_prompt: null,
            welcome_message: null,
            quick_actions: null,
            config: {
              model: "gpt-4o-mini",
              lowPriceThreshold: 30000,
              lowPriceMaxDiscount_0_31days: 1,
              lowPriceMaxDiscount_32_46days: 1.25,
              lowPriceMaxDiscount_47plus: 1.5,
              highPriceMaxDiscount_0_46days: 0.75,
              highPriceMaxDiscount_47plus: 1,
            },
          },
          {
            agent_type: "valuator",
            display_name: "Vehicle Valuator",
            is_active: true,
            system_prompt: null,
            welcome_message: null,
            quick_actions: null,
            config: { model: "gpt-4o-mini", temperature: 0.3 },
          },
        ],
        fromDefaults: true,
      })
    }

    if (error) {
      console.error("AI config fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch AI configs" }, { status: 500 })
    }

    return NextResponse.json({ agents: configs || [] })
  } catch (error) {
    console.error("AI config API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT — update an AI agent config
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createServiceClient()

    const body = await request.json()
    const { agent_type, ...updates } = body

    if (!agent_type || !["anna", "negotiator", "valuator"].includes(agent_type)) {
      return NextResponse.json({ error: "Valid agent_type required (anna, negotiator, valuator)" }, { status: 400 })
    }

    // Upsert — create if doesn't exist, update if does
    const { data, error } = await adminClient
      .from("ai_agent_config")
      .upsert({
        agent_type,
        ...updates,
        updated_by: user.email,
      }, { onConflict: "agent_type" })
      .select()
      .single()

    if (error) {
      console.error("AI config update error:", error)
      return NextResponse.json({ error: "Failed to update AI config" }, { status: 500 })
    }

    return NextResponse.json({ agent: data })
  } catch (error) {
    console.error("AI config update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
