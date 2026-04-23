import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const telemetrySchema = z.object({
  eventType: z.literal("vdp_360_fallback_activated"),
  vehicleId: z.string().uuid().nullable().optional(),
  stockNumber: z.string().min(1).max(64),
  failedFrames: z.number().int().min(0).max(1000),
  totalFrames: z.number().int().min(1).max(2000),
  failureRatio: z.number().min(0).max(1),
})

function hashStockNumber(value: string): string {
  return createHash("sha256").update(value.trim().toUpperCase()).digest("hex").slice(0, 16)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = telemetrySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PAYLOAD",
            message: "Telemetry payload validation failed",
          },
        },
        { status: 400 }
      )
    }

    const payload = parsed.data

    // Avoid raw stock identifiers in logs. Use short stable hash for correlation.
    console.warn("[vdp-360-telemetry] fallback", {
      eventType: payload.eventType,
      vehicleId: payload.vehicleId || null,
      stockHash: hashStockNumber(payload.stockNumber),
      failedFrames: payload.failedFrames,
      totalFrames: payload.totalFrames,
      failureRatio: payload.failureRatio,
      ts: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to record VDP telemetry",
        },
      },
      { status: 500 }
    )
  }
}
