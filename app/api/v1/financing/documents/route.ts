import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

type DocumentWithApplication = {
  id: string
  finance_applications_v2: { user_id: string }[]
}

// POST /api/v1/financing/documents - Upload document
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    const applicationId = formData.get("applicationId") as string
    const applicantId = formData.get("applicantId") as string | null
    const documentType = formData.get("documentType") as string
    
    if (!file || !applicationId || !documentType) {
      return NextResponse.json(
        { error: "Missing required fields: file, applicationId, documentType" },
        { status: 400 }
      )
    }
    
    // Verify application belongs to user
    const { data: application, error: appError } = await supabase
      .from("finance_applications_v2")
      .select("id, user_id")
      .eq("id", applicationId)
      .single()
    
    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }
    
    if (application.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    // Upload file to Vercel Blob (PRIVATE storage for security)
    const filename = `finance-docs/${applicationId}/${documentType}-${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: "private",
      contentType: file.type
    })
    
    // Save document record to database (store pathname, not URL for private blobs)
    const { data: document, error: docError } = await supabase
      .from("finance_documents")
      .insert({
        application_id: applicationId,
        applicant_id: applicantId || null,
        document_type: documentType,
        document_name: file.name,
        file_url: blob.pathname, // Store pathname for private blob access
        file_size: file.size,
        file_type: file.type,
        is_verified: false
      })
      .select()
      .single()
    
    if (docError) {
      console.error("Document insert error:", docError)
      return NextResponse.json({ error: "Failed to save document record" }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        pathname: blob.pathname, // Return pathname for secure access
        documentType,
        fileName: file.name
      }
    })
    
  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}

// GET /api/v1/financing/documents?applicationId=xxx - Get documents for application
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get("applicationId")
    
    if (!applicationId) {
      return NextResponse.json({ error: "applicationId required" }, { status: 400 })
    }
    
    // Verify application belongs to user
    const { data: application } = await supabase
      .from("finance_applications_v2")
      .select("id, user_id")
      .eq("id", applicationId)
      .single()
    
    if (!application || application.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    const { data: documents, error } = await supabase
      .from("finance_documents")
      .select("*")
      .eq("application_id", applicationId)
      .order("uploaded_at", { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data: documents })
    
  } catch (error) {
    console.error("Get documents error:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

// DELETE /api/v1/financing/documents?id=xxx - Delete document
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("id")
    
    if (!documentId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }
    
    // Verify document belongs to user's application
    const { data: document } = await supabase
      .from("finance_documents")
      .select(`
        id,
        finance_applications_v2!inner (user_id)
      `)
      .eq("id", documentId)
      .single()
    
    if (!document || (document as DocumentWithApplication).finance_applications_v2[0]?.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    const { error } = await supabase
      .from("finance_documents")
      .delete()
      .eq("id", documentId)
    
    if (error) {
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("Delete document error:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
