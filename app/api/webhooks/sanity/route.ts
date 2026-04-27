// Planet Motors — Sanity Webhook Handler
// Path: /api/webhooks/sanity
//
// Triggered by Sanity whenever a document is created, updated, or deleted.
// Responsibilities:
//   1. Validate the HMAC-SHA256 webhook signature (SANITY_WEBHOOK_SECRET)
//   2. Revalidate ISR paths so the site is always fresh without a manual rebuild
//   3. For vehicle documents: sync to Typesense in real-time (fire-and-forget)
//   4. Log the event for local visibility / debugging
//
// Sanity dashboard setup:
//   URL  : https://<your-domain>/api/webhooks/sanity
//   Secret: value of SANITY_WEBHOOK_SECRET env var
import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import crypto from "node:crypto"
import { logger } from "@/lib/logger"
import { syncVehicleToTypesense } from "@/lib/typesense/sync"

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))
  } catch {
    return false
  }
}

const TYPE_TO_TAGS: Record<string, string[]> = {
  vehicle:           ["sanity-vehicles"],
  siteSettings:      ["sanity-settings", "sanity-homepage"],
  homepage:          ["sanity-homepage"],
  navigation:        ["sanity-settings"],
  testimonial:       ["sanity-testimonials", "sanity-homepage"],
  promotion:         ["sanity-promos", "sanity-homepage"],
  faqItem:           ["sanity-faq"],
  faqEntry:          ["sanity-faq"],           // alias — schema uses both names
  blogPost:          ["sanity-blog"],
  protectionPlan:    ["sanity-protection"],
  lender:            ["sanity-lenders"],
  inventorySettings: ["sanity-inventory-settings"],
  aiSettings:        ["sanity-ai-settings"],
  sellYourCarPage:   ["sanity-sell-your-car"], // correct type name
  financingPage:     ["sanity-financing"],     // correct type name
  vdpSettings:       ["sanity-vdp-settings"],
  deliverySettings:  ["sanity-delivery-settings"],
  calculatorSettings:["sanity-calculator-settings"],
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const rawBody = await request.text()
    const secret = process.env.SANITY_WEBHOOK_SECRET
    if (!secret) {
      logger.error("[Sanity Webhook] SANITY_WEBHOOK_SECRET is not set")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }
    const signature = request.headers.get("sanity-webhook-signature") ?? ""
    if (!signature) {
      logger.warn("[Sanity Webhook] Missing sanity-webhook-signature header")
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }
    if (!verifySignature(rawBody, signature, secret)) {
      logger.warn("[Sanity Webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
    const payload = JSON.parse(rawBody) as { _type?: string; _id?: string; operation?: string }
    const documentType = payload._type ?? "unknown"
    const documentId   = payload._id   ?? "unknown"
    const operation    = payload.operation ?? "update"
    logger.info(`[Sanity Webhook] Received: type=${documentType} id=${documentId} op=${operation}`)

    // ── Step 1: ISR cache revalidation (always runs, never blocked) ────────
    revalidatePath("/")
    revalidatePath("/inventory")
    // Revalidate the page-specific path for this document type (inline map — no behavior change)
    const TYPE_TO_PAGE: Record<string, string> = {
      blogPost: "/blog", sellYourCarPage: "/sell-your-car", financingPage: "/financing",
      faqItem: "/faq",   faqEntry: "/faq",   protectionPlan: "/protection-plans", testimonial: "/about",
    }
    const typePage = TYPE_TO_PAGE[documentType]
    if (typePage) revalidatePath(typePage, "page")
    logger.info(`[Sanity Webhook] revalidatePath → / /inventory + type-specific paths`)

    // Revalidate specific cache tags for the document type
    const tagsToRevalidate = TYPE_TO_TAGS[documentType] ?? []
    for (const tag of tagsToRevalidate) {
      revalidateTag(tag, "page")
    }
    if (tagsToRevalidate.length > 0) {
      logger.info(`[Sanity Webhook] revalidateTag → [${tagsToRevalidate.join(", ")}]`)
    }

    // ── Step 2: Typesense sync for vehicle documents (fire-and-forget) ─────
    // This runs AFTER ISR revalidation is already queued, so a Typesense
    // failure can never delay or block the site cache update.
    let typesenseResult: { success: boolean; action: string; error?: string } | null = null
    if (documentType === "vehicle" && documentId !== "unknown") {
      typesenseResult = await syncVehicleToTypesense(documentId, operation).catch((err) => {
        // Belt-and-suspenders: syncVehicleToTypesense never throws, but just in case
        logger.error("[Sanity Webhook] Unexpected Typesense sync error:", err)
        return { success: false, action: "unexpected_error", error: String(err) }
      })

      if (typesenseResult.success) {
        logger.info(
          `[Sanity Webhook] Typesense sync: action=${typesenseResult.action} id=${documentId}`
        )
      } else {
        // Log the failure but DO NOT return an error response — ISR already succeeded
        logger.error(
          `[Sanity Webhook] Typesense sync FAILED (site cache still updated): ` +
          `action=${typesenseResult.action} id=${documentId} error=${typesenseResult.error}`
        )
      }
    }

    const elapsed = Date.now() - startedAt
    logger.info(`[Sanity Webhook] Done in ${elapsed}ms`)
    return NextResponse.json({
      success: true,
      documentType,
      documentId,
      operation,
      revalidatedPaths: ["/", "/inventory"],
      revalidatedTags: tagsToRevalidate,
      typesense: typesenseResult ?? { action: "not_applicable" },
      elapsedMs: elapsed,
    })
  } catch (error) {
    logger.error("[Sanity Webhook] Unhandled error:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
