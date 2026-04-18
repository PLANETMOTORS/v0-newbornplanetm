/**
 * Anna's lead capture — auto-creates leads when customers express interest.
 *
 * Detects intent signals in conversation (asking about specific vehicles,
 * wanting test drives, finance questions) and saves them as leads.
 */

import { createClient } from "@supabase/supabase-js"
import { sendNotificationEmail } from "@/lib/email"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

export interface LeadData {
  source: "chat" | "contact_form" | "test_drive" | "phone"
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerId?: string
  vehicleId?: string
  vehicleInfo?: string
  subject: string
  message?: string
  priority?: "low" | "medium" | "high" | "urgent"
  conversationId?: string
}

/**
 * Create a lead in the leads table and send notification email.
 * Gracefully handles missing leads table (returns null).
 */
export async function createLead(data: LeadData): Promise<string | null> {
  const client = getAdminClient()

  try {
    const { data: lead, error } = await client
      .from("leads")
      .insert({
        source: data.source,
        status: "new",
        priority: data.priority || "medium",
        customer_name: data.customerName || null,
        customer_email: data.customerEmail || null,
        customer_phone: data.customerPhone || null,
        customer_id: data.customerId || null,
        vehicle_id: data.vehicleId || null,
        vehicle_info: data.vehicleInfo || null,
        subject: data.subject,
        message: data.message || null,
      })
      .select("id")
      .single()

    if (error) {
      // Table might not exist yet
      console.error("Lead creation error:", error.message)
      return null
    }

    // Send notification email (non-blocking)
    sendNotificationEmail({
      type: "vehicle_inquiry",
      customerName: data.customerName || "Chat Visitor",
      customerEmail: data.customerEmail || "unknown@chat",
      customerPhone: data.customerPhone,
      additionalData: {
        subject: data.subject,
        message: data.message || "Lead captured from Anna chat",
        source: data.source === "chat" ? "Anna AI Chat" : data.source,
        vehicleInfo: data.vehicleInfo,
      },
    }).catch(err => console.error("Lead notification email failed:", err))

    return lead?.id || null
  } catch (err) {
    console.error("Lead capture failed:", err)
    return null
  }
}

/**
 * Save a chat conversation to the database.
 * Returns conversation ID or null if table doesn't exist.
 */
export async function saveConversation(params: {
  sessionId: string
  customerName?: string
  customerEmail?: string
  customerId?: string
  vehicleContext?: Record<string, unknown>
}): Promise<string | null> {
  const client = getAdminClient()

  try {
    const { data, error } = await client
      .from("chat_conversations")
      .upsert({
        session_id: params.sessionId,
        customer_name: params.customerName || null,
        customer_email: params.customerEmail || null,
        customer_id: params.customerId || null,
        vehicle_context: params.vehicleContext || null,
        status: "active",
      }, { onConflict: "session_id" })
      .select("id")
      .single()

    if (error) {
      console.error("Conversation save error:", error.message)
      return null
    }
    return data?.id || null
  } catch {
    return null
  }
}

/**
 * Save a chat message to the database.
 */
export async function saveChatMessage(params: {
  conversationId: string
  role: "user" | "assistant" | "system"
  content: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const client = getAdminClient()

  try {
    await client.from("chat_messages").insert({
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content,
      metadata: params.metadata || null,
    })

    // Update message count — RPC might not exist, ignore errors
    try {
      await client.rpc("increment_message_count", { conv_id: params.conversationId })
    } catch {
      // Fallback: just ignore — message count is non-critical
    }
  } catch {
    // Non-critical — don't fail the chat
  }
}

/**
 * Mark a conversation as escalated (customer wants human help).
 */
export async function escalateConversation(params: {
  conversationId?: string
  sessionId: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  reason: string
  vehicleInfo?: string
}): Promise<string | null> {
  const client = getAdminClient()

  // Update conversation status
  if (params.conversationId) {
    try {
      await client
        .from("chat_conversations")
        .update({ status: "escalated", escalated_at: new Date().toISOString() })
        .eq("id", params.conversationId)
    } catch {
      // Non-critical — continue with lead creation
    }
  }

  // Create an urgent lead
  const leadId = await createLead({
    source: "chat",
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    vehicleInfo: params.vehicleInfo,
    subject: `Escalation: ${params.reason}`,
    message: `Customer requested human assistance via Anna chat. Reason: ${params.reason}`,
    priority: "urgent",
    conversationId: params.conversationId || undefined,
  })

  return leadId
}
