import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Verify Sanity webhook signature
function verifySignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")
  return signature === expectedSignature
}

// Map Sanity document types to cache tags
const TYPE_TO_TAGS: Record<string, string[]> = {
  siteSettings: ["sanity-settings", "sanity-homepage"],
  homepageHero: ["sanity-homepage"],
  testimonial: ["sanity-testimonials", "sanity-homepage"],
  promotion: ["sanity-promos", "sanity-homepage"],
  faqEntry: ["sanity-faq", "sanity-homepage"],
  blogPost: ["sanity-blog"],
  protectionPlan: ["sanity-protection"],
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("sanity-webhook-signature") || ""
    const secret = process.env.SANITY_WEBHOOK_SECRET

    if (!secret) {
      console.error("[Sanity Webhook] Missing SANITY_WEBHOOK_SECRET")
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
      revalidateTag(tag, "max")
    }

    console.log(`[Sanity Webhook] Revalidated tags for ${documentType}:`, tagsToRevalidate)

    return NextResponse.json({
      success: true,
      revalidated: tagsToRevalidate,
      documentType,
    })
  } catch (error) {
    console.error("[Sanity Webhook] Error:", error)
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    )
  }
}
