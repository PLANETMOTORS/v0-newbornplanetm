import Replicate from "replicate"
import { put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedAdmin } from "@/lib/api/auth-helpers"

const REPLICATE_MODEL = "wan-video/wan-2.7-i2v"
const REPLICATE_TIMEOUT_MS = 300_000 // 5 min — video gen is slow

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin()
    if (admin.error) return admin.error

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: "REPLICATE_API_TOKEN not configured" }, { status: 503 })
    }

    const body = await request.json()
    const { imageUrl, prompt, vehicleId, vehicleName } = body

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 })
    }

    const defaultPrompt = "Slow cinematic camera pan around the vehicle, smooth motion, professional automotive commercial look, studio lighting, 4K quality"
    const videoPrompt = prompt || defaultPrompt

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    const output = await Promise.race([
      replicate.run(REPLICATE_MODEL, {
        input: {
          first_frame: imageUrl,
          prompt: videoPrompt,
          max_area: "832x480",
          duration: 5,
          fast_mode: "balanced",
          sample_shift: 8,
          sample_steps: 30,
          sample_guide_scale: 5,
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Video generation timed out (5 min)")), REPLICATE_TIMEOUT_MS)
      ),
    ])

    // Wan i2v returns a ReadableStream or URL
    let videoUrl: string
    if (output && typeof output === "object" && "url" in (output as Record<string, unknown>)) {
      videoUrl = (output as { url: string }).url
    } else if (typeof output === "string") {
      videoUrl = output
    } else {
      // It might be a ReadableStream — try to get the URL from the output
      videoUrl = String(output)
    }

    // Store to Vercel Blob for persistence
    const slug = vehicleName?.replace(/\s+/g, "-").toLowerCase() || vehicleId || "vehicle"
    const videoRes = await fetch(videoUrl)
    if (!videoRes.ok) throw new Error("Failed to download generated video")
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer())

    const blob = await put(`vehicles/${slug}/ai-video-${Date.now()}.mp4`, videoBuffer, {
      access: "public",
      contentType: "video/mp4",
    })

    return NextResponse.json({
      videoUrl: blob.url,
      prompt: videoPrompt,
      vehicle: vehicleName || vehicleId,
      duration: 5,
    })
  } catch (error) {
    console.error("AI Video error:", error)
    const msg = error instanceof Error ? error.message : "Failed to generate video"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
