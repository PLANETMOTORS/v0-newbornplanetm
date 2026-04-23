import { createClient as createServiceClient } from "@supabase/supabase-js"

interface KnowledgeEntry {
  id: string
  agent_type: string
  category: string
  trigger_phrase: string
  response: string
  priority: number
  tags: string[] | null
}

const CATEGORY_LABELS: Record<string, string> = {
  qa: "Q&A TRAINED RESPONSES",
  instruction: "CUSTOM INSTRUCTIONS",
  policy: "POLICY OVERRIDES",
  script: "SCRIPTED RESPONSES",
  objection: "OBJECTION HANDLING",
}

/**
 * Fetch active knowledge entries for an agent and format them
 * as a system prompt section that the AI can use for trained responses.
 */
export async function buildKnowledgePrompt(agentType: string): Promise<string> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) return ""

    const adminClient = createServiceClient(supabaseUrl, serviceKey)

    const { data, error } = await adminClient
      .from("ai_agent_knowledge")
      .select("category, trigger_phrase, response, priority, tags")
      .eq("agent_type", agentType)
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })

    if (error || !data || data.length === 0) return ""

    const entries = data as KnowledgeEntry[]

    // Group by category
    const grouped = new Map<string, KnowledgeEntry[]>()
    for (const entry of entries) {
      const cat = entry.category || "qa"
      const existing = grouped.get(cat)
      if (existing) {
        existing.push(entry)
      } else {
        grouped.set(cat, [entry])
      }
    }

    let prompt = `\n=============================================
TRAINED KNOWLEDGE & CUSTOM RESPONSES (${entries.length} entries):
=============================================
IMPORTANT: These are admin-trained responses. When a customer's question matches
a trigger phrase below, use the corresponding trained response as your answer.
These take PRIORITY over your general knowledge.\n\n`

    for (const [category, catEntries] of grouped) {
      const label = CATEGORY_LABELS[category] || category.toUpperCase()
      prompt += `--- ${label} ---\n`
      for (const entry of catEntries) {
        prompt += `IF customer asks: "${entry.trigger_phrase}"\n`
        prompt += `THEN respond: ${entry.response}\n`
        if (entry.tags && entry.tags.length > 0) {
          prompt += `[Tags: ${entry.tags.join(", ")}]\n`
        }
        prompt += `\n`
      }
    }

    return prompt
  } catch (err) {
    console.error("Failed to build knowledge prompt:", err)
    return ""
  }
}
