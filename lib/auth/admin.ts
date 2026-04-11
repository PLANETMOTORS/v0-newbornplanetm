import { NextResponse } from "next/server"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"

type AdminCheckResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse }

function hasAdminRole(user: User): boolean {
  const appMetadata = (user.app_metadata || {}) as Record<string, unknown>
  const userMetadata = (user.user_metadata || {}) as Record<string, unknown>

  const roleValue =
    (typeof appMetadata.role === "string" ? appMetadata.role : null) ||
    (typeof userMetadata.role === "string" ? userMetadata.role : null)

  if (roleValue && ["admin", "super_admin"].includes(roleValue)) {
    return true
  }

  const roleList =
    (Array.isArray(appMetadata.roles) ? appMetadata.roles : null) ||
    (Array.isArray(userMetadata.roles) ? userMetadata.roles : null)

  if (roleList && roleList.some((role) => role === "admin" || role === "super_admin")) {
    return true
  }

  return appMetadata.is_admin === true || userMetadata.is_admin === true
}

export async function requireAdminUser(supabase: SupabaseClient): Promise<AdminCheckResult> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (!hasAdminRole(user)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { ok: true, user }
}

export function getAdminDataClient() {
  return createAdminClient()
}

export async function recordAdminAuditEvent(event: {
  actorId: string
  action: string
  entityType: string
  entityId: string
  beforeState?: string | null
  afterState?: string | null
  notes?: string | null
}) {
  try {
    const adminClient = createAdminClient()
    await adminClient.from("admin_audit_events").insert({
      actor_id: event.actorId,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId,
      before_state: event.beforeState || null,
      after_state: event.afterState || null,
      notes: event.notes || null,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Do not block admin workflows if the optional audit sink is unavailable.
  }
}