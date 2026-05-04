import Replicate from "replicate"
import { put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/security/admin-route-helpers"
import { createAdminClient } from "@/lib/supabase/admin"

export const maxDuration = 180 // 3 minutes — Real-ESRGAN upscaling via Replicate

const REPLICATE_MODEL = "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa"
const REPLICATE_TIMEOUT_MS = 120_000

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission("ai_enhance", "read")
    if (!auth.ok) return auth.error

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: "REPLICATE_API_TOKEN not configured" }, { status: 503 })
    }

    const body = await request.json()
    const { vehicleId, imageUrl, scale = 4, saveToVehicle = false } = body

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 })
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    const output = await Promise.race([
      replicate.run(REPLICATE_MODEL, {
        input: { image: imageUrl, scale, face_enhance: false },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Replicate timeout")), REPLICATE_TIMEOUT_MS)
      ),
    ]) as string

    // output is a URL string from Real-ESRGAN
    const enhancedUrl = typeof output === "string" ? output : String(output)

    // Optionally store to Vercel Blob and update vehicle record
    let blobUrl = enhancedUrl
    if (saveToVehicle && vehicleId) {
      const imgRes = await fetch(enhancedUrl)
      if (!imgRes.ok) throw new Error("Failed to download enhanced image")
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

      const blob = await put(`vehicles/${vehicleId}/enhanced-${Date.now()}.jpg`, imgBuffer, {
        access: "public",
        contentType: "image/jpeg",
      })
      blobUrl = blob.url

      // Update vehicle image_urls if requested
      const supabase = createAdminClient()
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("image_urls")
        .eq("id", vehicleId)
        .single()

      if (vehicle) {
        const urls = vehicle.image_urls || []
        const idx = urls.indexOf(imageUrl)
        if (idx >= 0) {
          urls[idx] = blobUrl
          await supabase.from("vehicles").update({ image_urls: urls }).eq("id", vehicleId)
        }
      }
    }

    return NextResponse.json({
      enhancedUrl: blobUrl,
      originalUrl: imageUrl,
      scale,
      saved: saveToVehicle && !!vehicleId,
    })
  } catch (error) {
    console.error("AI Enhance error:", error)
    const msg = error instanceof Error ? error.message : "Failed to enhance image"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
