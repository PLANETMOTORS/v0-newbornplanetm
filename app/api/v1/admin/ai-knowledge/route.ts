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

interface KnowledgeEntry {
  id: string
  agent_type: string
  category: string
  trigger_phrase: string
  response: string
  is_active: boolean
  priority: number
  tags: string[] | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

// GET — fetch knowledge entries for an agent (or all agents)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createServiceClient()

    const agentType = request.nextUrl.searchParams.get("agent_type")
    const category = request.nextUrl.searchParams.get("category")
    const activeOnly = request.nextUrl.searchParams.get("active_only") === "true"

    let query = adminClient
      .from("ai_agent_knowledge")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })

    if (agentType) query = query.eq("agent_type", agentType)
    if (category) query = query.eq("category", category)
    if (activeOnly) query = query.eq("is_active", true)

    const { data, error } = await query

    if (error && (error.message?.includes("does not exist") || error.message?.includes("Could not find") || error.code === "PGRST205")) {
      // Table not created yet — return empty
      return NextResponse.json({ entries: [], tableExists: false })
    }

    if (error) {
      console.error("AI knowledge fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch knowledge entries" }, { status: 500 })
    }

    return NextResponse.json({ entries: (data || []) as KnowledgeEntry[], tableExists: true })
  } catch (error) {
    console.error("AI knowledge API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — create a new knowledge entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createServiceClient()

    const body = await request.json()
    const { agent_type, category, trigger_phrase, response, priority, tags } = body

    if (!agent_type || !["anna", "negotiator", "valuator"].includes(agent_type)) {
      return NextResponse.json({ error: "Valid agent_type required" }, { status: 400 })
    }
    if (!trigger_phrase?.trim() || !response?.trim()) {
      return NextResponse.json({ error: "trigger_phrase and response are required" }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from("ai_agent_knowledge")
      .insert({
        agent_type,
        category: category || "qa",
        trigger_phrase: trigger_phrase.trim(),
        response: response.trim(),
        priority: priority ?? 0,
        tags: tags || null,
        is_active: true,
        created_by: user.email,
        updated_by: user.email,
      })
      .select()
      .single()

    if (error) {
      console.error("AI knowledge create error:", error)
      return NextResponse.json({ error: "Failed to create knowledge entry" }, { status: 500 })
    }

    return NextResponse.json({ entry: data }, { status: 201 })
  } catch (error) {
    console.error("AI knowledge create API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT — update an existing knowledge entry
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createServiceClient()

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Clean up updates
    const cleanUpdates: Record<string, unknown> = { updated_by: user.email }
    if (updates.trigger_phrase !== undefined) cleanUpdates.trigger_phrase = updates.trigger_phrase.trim()
    if (updates.response !== undefined) cleanUpdates.response = updates.response.trim()
    if (updates.category !== undefined) cleanUpdates.category = updates.category
    if (updates.priority !== undefined) cleanUpdates.priority = updates.priority
    if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active
    if (updates.tags !== undefined) cleanUpdates.tags = updates.tags

    const { data, error } = await adminClient
      .from("ai_agent_knowledge")
      .update(cleanUpdates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("AI knowledge update error:", error)
      return NextResponse.json({ error: "Failed to update knowledge entry" }, { status: 500 })
    }

    return NextResponse.json({ entry: data })
  } catch (error) {
    console.error("AI knowledge update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE — remove a knowledge entry
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createServiceClient()

    const id = request.nextUrl.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 })
    }

    const { error } = await adminClient
      .from("ai_agent_knowledge")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("AI knowledge delete error:", error)
      return NextResponse.json({ error: "Failed to delete knowledge entry" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("AI knowledge delete API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
