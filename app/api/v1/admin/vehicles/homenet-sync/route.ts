import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"

/**
 * Manual HomeNet Sync Trigger
 * POST — triggers an immediate sync by calling the existing cron endpoint
 * GET  — returns the last sync status (reads from vehicles table updated_at)
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the existing cron endpoint directly (internal call)
    const baseUrl = request.nextUrl.origin
    const cronSecret = process.env.CRON_SECRET

    const response = await fetch(`${baseUrl}/api/cron/homenet-sync`, {
      method: "GET",
      headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: result.error || "Sync failed",
        details: result.details,
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      vehiclesParsed: result.vehiclesParsed,
      inserted: result.inserted,
      updated: result.updated,
      errors: result.errors,
      duration_ms: result.duration_ms,
    })
  } catch (error) {
    console.error("Manual sync error:", error)
    return NextResponse.json({ error: "Failed to trigger sync" }, { status: 500 })
  }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check env vars to determine if HomeNet integration is configured
    const isConfigured = !!(
      process.env.HOMENET_SFTP_HOST &&
      (process.env.HOMENET_SFTP_USER || process.env.HOMENET_SFTP_USERNAME) &&
      (process.env.HOMENET_SFTP_PASS || process.env.HOMENET_SFTP_PASSWORD)
    )

    // Get the most recently updated vehicle to estimate last sync time
    const { data: latest } = await supabase
      .from("vehicles")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      configured: isConfigured,
      lastSyncEstimate: latest?.updated_at || null,
      cronSchedule: "*/15 * * * *",
      cronDescription: "Every 15 minutes",
      envVars: {
        HOMENET_SFTP_HOST: isConfigured ? "configured" : "missing",
        HOMENET_SFTP_USER: (process.env.HOMENET_SFTP_USER || process.env.HOMENET_SFTP_USERNAME) ? "configured" : "missing",
        HOMENET_SFTP_PASS: (process.env.HOMENET_SFTP_PASS || process.env.HOMENET_SFTP_PASSWORD) ? "configured" : "missing",
        HOMENET_API_KEY: process.env.HOMENET_API_KEY ? "configured" : "missing",
        CRON_SECRET: process.env.CRON_SECRET ? "configured" : "missing",
      },
    })
  } catch (error) {
    console.error("Sync status error:", error)
    return NextResponse.json({ error: "Failed to get sync status" }, { status: 500 })
  }
}
