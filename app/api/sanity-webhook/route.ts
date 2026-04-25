import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import crypto from "node:crypto"

import { logger } from '@/lib/logger'
import { setKey } from '@/lib/redis'

// Verify Sanity webhook signature
function verifySignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")
  return signature === expectedSignature
}

// Map Sanity document types to cache tags (kept in sync with /api/webhooks/sanity)
const TYPE_TO_TAGS: Record<string, string[]> = {
  siteSettings:      ["sanity-settings", "sanity-homepage"],
  homepage:          ["sanity-homepage"],
  navigation:        ["sanity-settings"],
  testimonial:       ["sanity-testimonials", "sanity-homepage"],
  promotion:         ["sanity-promos", "sanity-homepage"],
  faqItem:           ["sanity-faq"],
  faqEntry:          ["sanity-faq"],           // legacy alias
  blogPost:          ["sanity-blog"],
  protectionPlan:    ["sanity-protection"],
  lender:            ["sanity-lenders"],
  inventorySettings: ["sanity-inventory-settings"],
  aiSettings:        ["sanity-ai-settings"],
  sellYourCarPage:   ["sanity-sell-your-car"],
  financingPage:     ["sanity-financing"],
  vehicle:           ["sanity-vehicles"],
}

/** Redis key used by the system-health endpoint to read last trigger info */
export const SANITY_WEBHOOK_REDIS_KEY = "system:sanity_webhook:last_trigger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("sanity-webhook-signature") || ""
    const secret = process.env.SANITY_WEBHOOK_SECRET

    if (!secret) {
      logger.error("[Sanity Webhook] Missing SANITY_WEBHOOK_SECRET")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    // Verify webhook signature
    if (!verifySignature(body, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const documentType = payload._type

    // Get tags to revalidate based on document type
    const tagsToRevalidate = TYPE_TO_TAGS[documentType] || []

    // Revalidate all relevant tags
    for (const tag of tagsToRevalidate) {
      revalidateTag(tag, "page")
    }

    logger.info(`[Sanity Webhook] Revalidated tags for ${documentType}:`, tagsToRevalidate)

    // Persist last-trigger metadata for the system-health endpoint (fire-and-forget)
    setKey(
      SANITY_WEBHOOK_REDIS_KEY,
      {
        timestamp: new Date().toISOString(),
        documentType,
        tagsRevalidated: tagsToRevalidate,
        status: "ok",
      },
      86400 // 24-hour TTL
    ).catch((err) =>
      logger.warn("[Sanity Webhook] Failed to persist trigger timestamp:", err)
    )

    return NextResponse.json({
      success: true,
      revalidated: tagsToRevalidate,
      documentType,
    })
  } catch (error) {
    logger.error("[Sanity Webhook] Error:", error)
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    )
  }
}
