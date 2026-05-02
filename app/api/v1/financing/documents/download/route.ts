import { type NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

type DocumentWithFileAndApplication = {
  id: string
  file_url: string
  finance_applications_v2: { user_id: string }
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

function isDocumentWithFileAndApplication(value: unknown): value is DocumentWithFileAndApplication {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false
  }

  const record = value as Record<string, unknown>
  if (typeof record.id !== "string" || typeof record.file_url !== "string") {
    return false
  }

  const application = record.finance_applications_v2
  if (Object.prototype.toString.call(application) !== "[object Object]") {
    return false
  }

  return typeof (application as Record<string, unknown>).user_id === "string"
}

type SupaClient = Awaited<ReturnType<typeof createClient>>

async function authoriseAdmin(supabase: SupaClient, userId: string): Promise<NextResponse | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()
  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
    return errorResponse(403, "FORBIDDEN", "Admin access required")
  }
  return null
}

async function authoriseDocumentOwner(
  supabase: SupaClient,
  userId: string,
  documentId: string,
  pathname: string,
): Promise<NextResponse | null> {
  const { data: document } = await supabase
    .from("finance_documents")
    .select(`id, file_url, finance_applications_v2!inner (user_id)`)
    .eq("id", documentId)
    .single()
  if (!document) return errorResponse(404, "DOCUMENT_NOT_FOUND", "Document not found")
  if (!isDocumentWithFileAndApplication(document)) {
    return errorResponse(500, "MALFORMED_DOCUMENT_PAYLOAD", "Document payload is malformed")
  }
  const validatedDoc = document as unknown as DocumentWithFileAndApplication
  if (validatedDoc.finance_applications_v2.user_id !== userId) {
    return errorResponse(403, "FORBIDDEN", "Unauthorized")
  }
  if (document.file_url !== pathname) {
    return errorResponse(400, "INVALID_PATHNAME", "Invalid pathname")
  }
  return null
}

// GET /api/v1/financing/documents/download?pathname=xxx&documentId=xxx
// Secure route to serve private blob files
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const pathname = searchParams.get("pathname")
    const documentId = searchParams.get("documentId")
    const isAdmin = searchParams.get("admin") === "true"

    if (!pathname) return errorResponse(400, "MISSING_PATHNAME", "Missing pathname")
    if (!user) return errorResponse(401, "UNAUTHORIZED", "Unauthorized")

    if (isAdmin) {
      const adminError = await authoriseAdmin(supabase, user.id)
      if (adminError) return adminError
    } else {
      if (!documentId) return errorResponse(400, "MISSING_DOCUMENT_ID", "Document ID required")
      const ownerError = await authoriseDocumentOwner(supabase, user.id, documentId, pathname)
      if (ownerError) return ownerError
    }
    
    // Fetch the private blob
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })
    
    if (!result) {
      return new NextResponse("File not found", { status: 404 })
    }
    
    // Handle 304 Not Modified (browser cache)
    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, no-cache",
        },
      })
    }
    
    // Stream the file to the client
    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Disposition": `inline; filename="${pathname.split("/").pop()}"`,
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    })
    
  } catch (error) {
    console.error("Error serving document:", error)
    return errorResponse(500, "SERVE_DOCUMENT_FAILED", "Failed to serve document")
  }
}
