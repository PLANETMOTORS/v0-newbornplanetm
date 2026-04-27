 
import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"
import { getKey } from "@/lib/redis"
import { isTypesenseConfigured } from "@/lib/typesense/client"
import { logger } from "@/lib/logger"

// ── Constants ──────────────────────────────────────────────────────────────

/** Redis key written by app/api/sanity-webhook/route.ts on each successful trigger */
const SANITY_WEBHOOK_REDIS_KEY = "system:sanity_webhook:last_trigger"

/** If the last HomenetIOL sync is older than this, mark status as "stale" */
const HOMENET_STALE_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes

// ── Types ──────────────────────────────────────────────────────────────────

interface SanityWebhookRecord {
  timestamp: string
  documentType: string
  documentId: string
  operation: string
  tagsRevalidated: string[]
}

// ── Auth guard ─────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<{ user: { email: string } } | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null
    return { user: { email: user.email ?? "" } }
  } catch {
    return null
  }
}

// ── GET — system health summary ────────────────────────────────────────────

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const generatedAt = new Date().toISOString()

    // ── 1. Sanity Webhook status ───────────────────────────────────────────
    const sanityRecord = await getKey<SanityWebhookRecord>(SANITY_WEBHOOK_REDIS_KEY)

    const sanityWebhook = sanityRecord
      ? {
          lastTriggeredAt: sanityRecord.timestamp,
          documentType: sanityRecord.documentType,
          tagsRevalidated: sanityRecord.tagsRevalidated,
          status: "ok" as const,
        }
      : {
          lastTriggeredAt: null,
          documentType: null,
          tagsRevalidated: [],
          status: "unknown" as const,
          note: "No webhook trigger recorded yet (Redis may be unavailable or webhook has never fired)",
        }

    // ── 2. HomenetIOL SFTP sync status ────────────────────────────────────
    const isHomenetConfigured = !!(
      process.env.HOMENET_SFTP_HOST &&
      (process.env.HOMENET_SFTP_USER || process.env.HOMENET_SFTP_USERNAME) &&
      (process.env.HOMENET_SFTP_PASS || process.env.HOMENET_SFTP_PASSWORD)
    )

    let homenetLastSync: string | null = null
    if (isHomenetConfigured) {
      try {
        const supabase = await createClient()
        const { data: latest } = await supabase
          .from("vehicles")
          .select("updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single()
        homenetLastSync = latest?.updated_at ?? null
      } catch (err) {
        logger.warn("[system-health] Failed to query vehicles.updated_at:", err)
      }
    }

    let homenetStatus: "ok" | "stale" | "unconfigured"
    if (!isHomenetConfigured) {
      homenetStatus = "unconfigured"
    } else if (!homenetLastSync) {
      homenetStatus = "stale"
    } else {
      const ageMs = Date.now() - new Date(homenetLastSync).getTime()
      homenetStatus = ageMs > HOMENET_STALE_THRESHOLD_MS ? "stale" : "ok"
    }

    const homenetSftp = {
      configured: isHomenetConfigured,
      lastSyncEstimate: homenetLastSync,
      cronSchedule: "*/15 * * * *",
      cronDescription: "Every 15 minutes",
      status: homenetStatus,
      envVars: {
        HOMENET_SFTP_HOST: process.env.HOMENET_SFTP_HOST ? "configured" : "missing",
        HOMENET_SFTP_USER: (process.env.HOMENET_SFTP_USER || process.env.HOMENET_SFTP_USERNAME)
          ? "configured"
          : "missing",
        HOMENET_SFTP_PASS: (process.env.HOMENET_SFTP_PASS || process.env.HOMENET_SFTP_PASSWORD)
          ? "configured"
          : "missing",
      },
    }

    // ── 3. Typesense status ───────────────────────────────────────────────
    const typesenseConfigured = isTypesenseConfigured()
    const typesense = {
      configured: typesenseConfigured,
      status: typesenseConfigured ? ("ok" as const) : ("unconfigured" as const),
    }

    return NextResponse.json({
      generatedAt,
      sanityWebhook,
      homenetSftp,
      typesense,
    })
  } catch (error) {
    logger.error("[system-health] GET error:", error)
    return NextResponse.json({ error: "Failed to retrieve system health" }, { status: 500 })
  }
}

// ── POST — admin actions (cache purge) ────────────────────────────────────

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const action = (body as { action?: string }).action

    if (action === "purge-cache") {
      // Revalidate the entire layout tree — busts all cached pages
      revalidatePath("/", "layout")

      logger.info(`[system-health] Cache purged by ${admin.user.email}`)

      return NextResponse.json({
        success: true,
        action: "purge-cache",
        purgedAt: new Date().toISOString(),
        purgedBy: admin.user.email,
        message: "Full site cache purged. Pages will be regenerated on next request.",
      })
    }

    return NextResponse.json(
      { error: `Unknown action: "${action}". Supported actions: purge-cache` },
      { status: 400 }
    )
  } catch (error) {
    logger.error("[system-health] POST error:", error)
    return NextResponse.json({ error: "Failed to execute action" }, { status: 500 })
  }
}
