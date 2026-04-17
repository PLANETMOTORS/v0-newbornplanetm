// POST /api/typesense/setup — Create or re-create the vehicles collection
import { NextResponse } from "next/server"
import { getAdminClient, VEHICLES_COLLECTION, VEHICLES_SCHEMA } from "@/lib/typesense/client"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  // Verify cron / admin secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const client = getAdminClient()
  if (!client) {
    return NextResponse.json(
      { error: "Typesense not configured — set TYPESENSE_API_KEY and TYPESENSE_HOST" },
      { status: 503 }
    )
  }

  try {
    // Try to retrieve existing collection
    try {
      await client.collections(VEHICLES_COLLECTION).retrieve()
      // Already exists — drop and recreate if ?force=true
      const url = new URL(request.url)
      if (url.searchParams.get("force") === "true") {
        await client.collections(VEHICLES_COLLECTION).delete()
        console.info("[Typesense Setup] Dropped existing collection")
      } else {
        return NextResponse.json({
          success: true,
          message: "Collection already exists. Pass ?force=true to recreate.",
        })
      }
    } catch {
      // Collection doesn't exist — will create below
    }

    const created = await client.collections().create(VEHICLES_SCHEMA)
    console.info(`[Typesense Setup] Created collection: ${created.name}`)

    return NextResponse.json({
      success: true,
      message: `Collection '${created.name}' created`,
      fields: created.fields?.length ?? 0,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[Typesense Setup] Error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  const client = getAdminClient()
  if (!client) {
    return NextResponse.json({ configured: false })
  }

  try {
    const collection = await client.collections(VEHICLES_COLLECTION).retrieve()
    return NextResponse.json({
      configured: true,
      collection: collection.name,
      numDocuments: collection.num_documents,
      fields: collection.fields?.length ?? 0,
    })
  } catch {
    return NextResponse.json({ configured: true, collection: null })
  }
}
