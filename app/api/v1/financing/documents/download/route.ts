import { type NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

type DocumentWithFileAndApplication = {
  id: string
  file_url: string
  finance_applications_v2: { user_id: string }[]
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
    
    if (!pathname) {
      return NextResponse.json({ error: "Missing pathname" }, { status: 400 })
    }
    
    // For admin access, check if user is admin
    if (isAdmin) {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      
      // Check if user has admin role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      
      if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 })
      }
    } else {
      // For regular users, verify they own the document
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      
      if (!documentId) {
        return NextResponse.json({ error: "Document ID required" }, { status: 400 })
      }
      
      // Verify document belongs to user's application
      const { data: document } = await supabase
        .from("finance_documents")
        .select(`
          id,
          file_url,
          finance_applications_v2!inner (user_id)
        `)
        .eq("id", documentId)
        .single()
      
      if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }
      
      if ((document as DocumentWithFileAndApplication).finance_applications_v2[0]?.user_id !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      
      // Verify pathname matches stored file_url
      if (document.file_url !== pathname) {
        return NextResponse.json({ error: "Invalid pathname" }, { status: 400 })
      }
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
    return NextResponse.json({ error: "Failed to serve document" }, { status: 500 })
  }
}
