import { type NextRequest, NextResponse } from "next/server"

/**
 * Vercel Cron Job - runs every 15 minutes
 * Triggers the HomenetIOL SFTP → Neon Postgres sync
 *
 * Configured in vercel.json:
 * { "path": "/api/cron/sync-inventory", "schedule": "*/15 * * * *" }
 */
export async function GET(request: NextRequest) {
  // Vercel automatically sets this header for cron jobs
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // Allow Vercel cron or manual trigger with secret
  if (!isVercelCron && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://planetmotors.ca"

    const response = await fetch(`${baseUrl}/api/v1/inventory/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("[CronSync] Sync API returned error:", result)
      return NextResponse.json(
        { error: "Sync API failed", details: result },
        { status: 500 }
      )
    }

    console.log(
      `[CronSync] Success — inserted: ${result.inserted}, updated: ${result.updated}, removed: ${result.removed}, duration: ${result.duration_ms}ms`
    )

    return NextResponse.json({
      success: true,
      triggered_at: new Date().toISOString(),
      sync_result: result,
    })
  } catch (err: any) {
    console.error("[CronSync] Failed to trigger sync:", err.message)
    return NextResponse.json(
      { error: "Cron trigger failed", details: err.message },
      { status: 500 }
    )
  }
}
