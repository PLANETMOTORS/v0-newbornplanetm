import { NextRequest, NextResponse } from "next/server"
import { del, put } from "@vercel/blob"
import { hashClientIp } from "@/lib/hash-client-ip"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/redis"

const MAX_ID_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const ALLOWED_ID_TYPES = new Set(["driver_license", "passport", "provincial_id"])
const ALLOWED_PROVINCES = new Set(["ON", "QC", "BC", "AB", "MB", "SK", "NS", "NB", "PE", "NL", "NT", "NU", "YT"])
const MAX_ID_VERIFICATION_REQUESTS_PER_HOUR = 3 // Prevent spam

export async function POST(request: NextRequest) {
  const uploadedBlobPaths: string[] = []

  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting: max 3 submissions per hour per user
    const clientIp = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimitKey = `id-verification:${user.id}:${clientIp}`
    const rateLimitResult = await rateLimit(rateLimitKey, MAX_ID_VERIFICATION_REQUESTS_PER_HOUR, 3600)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many ID verification submissions. Please try again in 1 hour." },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    
    const applicationId = formData.get("applicationId") as string
    const primaryIdType = formData.get("primaryIdType") as string
    const primaryIdNumber = formData.get("primaryIdNumber") as string
    const primaryExpiryDate = formData.get("primaryExpiryDate") as string
    const primaryIssuingProvince = formData.get("primaryIssuingProvince") as string
    const primaryFrontImage = formData.get("primaryFrontImage") as File | null
    const primaryBackImage = formData.get("primaryBackImage") as File | null
    
    // Secondary ID (optional)
    const secondaryIdType = formData.get("secondaryIdType") as string | null
    const secondaryIdNumber = formData.get("secondaryIdNumber") as string | null
    const secondaryFrontImage = formData.get("secondaryFrontImage") as File | null
    const secondaryBackImage = formData.get("secondaryBackImage") as File | null

    // Validate required fields and format
    if (!primaryIdType || !primaryIdNumber || !primaryFrontImage) {
      return NextResponse.json(
        { error: "Primary ID type, number, and front image are required" },
        { status: 400 }
      )
    }

    // Validate ID type (whitelist)
    if (!ALLOWED_ID_TYPES.has(primaryIdType)) {
      return NextResponse.json(
        { error: `Invalid primary ID type. Allowed: ${Array.from(ALLOWED_ID_TYPES).join(", ")}` },
        { status: 400 }
      )
    }

    if (secondaryIdType && !ALLOWED_ID_TYPES.has(secondaryIdType)) {
      return NextResponse.json(
        { error: `Invalid secondary ID type. Allowed: ${Array.from(ALLOWED_ID_TYPES).join(", ")}` },
        { status: 400 }
      )
    }

    // Validate province (whitelist)
    if (primaryIssuingProvince && !ALLOWED_PROVINCES.has(primaryIssuingProvince.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid province code. Must be a valid Canadian province.` },
        { status: 400 }
      )
    }

    // Validate ID number format (basic: not empty, reasonable length)
    if (!primaryIdNumber || primaryIdNumber.length < 5 || primaryIdNumber.length > 20) {
      return NextResponse.json(
        { error: "Invalid ID number format" },
        { status: 400 }
      )
    }

    if (secondaryIdNumber && (secondaryIdNumber.length < 5 || secondaryIdNumber.length > 20)) {
      return NextResponse.json(
        { error: "Invalid secondary ID number format" },
        { status: 400 }
      )
    }

    // Validate expiry date format (YYYY-MM-DD or ISO)
    if (primaryExpiryDate) {
      try {
        const expiryParsed = new Date(primaryExpiryDate)
        if (isNaN(expiryParsed.getTime())) {
          throw new Error("Invalid date")
        }
        // Check not in past
        if (expiryParsed < new Date()) {
          return NextResponse.json(
            { error: "ID is expired" },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid expiry date format. Use YYYY-MM-DD." },
          { status: 400 }
        )
      }
    }

    const filesToValidate: Array<{ file: File | null; label: string }> = [
      { file: primaryFrontImage, label: "Primary front image" },
      { file: primaryBackImage, label: "Primary back image" },
      { file: secondaryFrontImage, label: "Secondary front image" },
      { file: secondaryBackImage, label: "Secondary back image" },
    ]

    for (const { file, label } of filesToValidate) {
      if (!file) {
        continue
      }

      const validationError = validateIdImageFile(file)
      if (validationError) {
        return NextResponse.json({ error: `${label}: ${validationError}` }, { status: 400 })
      }
    }

    // Generate unique folder path for this verification
    const timestamp = Date.now()
    const verificationId = `idv_${user.id}_${timestamp}`
    
    // Upload images to Vercel Blob (secure, private access)
    const uploadedDocuments: {
      type: string
      side: string
      url: string
      uploadedAt: string
    }[] = []

    // Upload primary ID front
    if (primaryFrontImage) {
      const blob = await put(
        `id-verification/${user.id}/${verificationId}/primary-front.${primaryFrontImage.name.split('.').pop()}`,
        primaryFrontImage,
        { access: "private", addRandomSuffix: true }
      )
      uploadedDocuments.push({
        type: "primary",
        side: "front",
        url: blob.pathname,
        uploadedAt: new Date().toISOString()
      })
      uploadedBlobPaths.push(blob.pathname)
    }

    // Upload primary ID back
    if (primaryBackImage) {
      const blob = await put(
        `id-verification/${user.id}/${verificationId}/primary-back.${primaryBackImage.name.split('.').pop()}`,
        primaryBackImage,
        { access: "private", addRandomSuffix: true }
      )
      uploadedDocuments.push({
        type: "primary",
        side: "back",
        url: blob.pathname,
        uploadedAt: new Date().toISOString()
      })
      uploadedBlobPaths.push(blob.pathname)
    }

    // Upload secondary ID images if provided
    if (secondaryFrontImage) {
      const blob = await put(
        `id-verification/${user.id}/${verificationId}/secondary-front.${secondaryFrontImage.name.split('.').pop()}`,
        secondaryFrontImage,
        { access: "private", addRandomSuffix: true }
      )
      uploadedDocuments.push({
        type: "secondary",
        side: "front",
        url: blob.pathname,
        uploadedAt: new Date().toISOString()
      })
      uploadedBlobPaths.push(blob.pathname)
    }

    if (secondaryBackImage) {
      const blob = await put(
        `id-verification/${user.id}/${verificationId}/secondary-back.${secondaryBackImage.name.split('.').pop()}`,
        secondaryBackImage,
        { access: "private", addRandomSuffix: true }
      )
      uploadedDocuments.push({
        type: "secondary",
        side: "back",
        url: blob.pathname,
        uploadedAt: new Date().toISOString()
      })
      uploadedBlobPaths.push(blob.pathname)
    }

    // Save verification record to Supabase
    const { data: verification, error: insertError } = await supabase
      .from("id_verifications")
      .insert({
        id: verificationId,
        user_id: user.id,
        application_id: applicationId || null,
        primary_id_type: primaryIdType,
        primary_id_number_hash: await hashIdNumber(primaryIdNumber), // Don't store raw ID numbers
        primary_expiry_date: primaryExpiryDate || null,
        primary_issuing_province: primaryIssuingProvince || null,
        secondary_id_type: secondaryIdType || null,
        secondary_id_number_hash: secondaryIdNumber ? await hashIdNumber(secondaryIdNumber) : null,
        documents: uploadedDocuments,
        status: "pending_review", // pending_review, verified, rejected
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        notes: null
      })
      .select()
      .single()

    if (insertError) {
      console.error("Failed to save ID verification:", insertError)
      await cleanupUploadedBlobs(uploadedBlobPaths)
      return NextResponse.json(
        { error: "Failed to save ID verification record. Please try again." },
        { status: 500 }
      )
    }

    // Update finance application status if applicationId provided
    if (applicationId) {
      const { data: updatedApplications, error: updateError } = await supabase
        .from("finance_applications")
        .update({ 
          id_verification_status: "submitted",
          id_verification_id: verificationId
        })
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .select("id")
      
      if (updateError || !updatedApplications || updatedApplications.length === 0) {
        console.error("Failed to update finance application:", updateError)

        const { error: rollbackError } = await supabase
          .from("id_verifications")
          .delete()
          .eq("id", verificationId)
          .eq("user_id", user.id)

        if (rollbackError) {
          console.error("Failed to rollback ID verification after linking failure:", rollbackError)
        }

        await cleanupUploadedBlobs(uploadedBlobPaths)
        return NextResponse.json(
          { error: "Failed to link ID verification to the financing application." },
          { status: 500 }
        )
      }
    }

    // Record audit trail for ID verification submission (fire-and-forget)
    ;(async () => {
      try {
        await supabase
          .from("id_verification_audits")
          .insert({
            user_id: user.id,
            verification_id: verificationId,
            action: "submitted",
            id_type_submitted: primaryIdType,
            has_secondary: !!secondaryIdType,
            documents_count: uploadedDocuments.length,
            client_ip_hash: hashClientIp(clientIp),
            submitted_at: new Date().toISOString(),
          })
      } catch {
        console.warn("[audit] Failed to record ID verification submission")
      }
    })()

    return NextResponse.json({
      success: true,
      verificationId,
      status: "pending_review",
      message: "Your ID documents have been submitted for verification. You will receive confirmation within 24-48 hours."
    })

  } catch (error) {
    console.error("ID verification error:", error)
    await cleanupUploadedBlobs(uploadedBlobPaths)
    return NextResponse.json(
      { error: "Failed to process ID verification" },
      { status: 500 }
    )
  }
}

// Hash ID number for secure storage (don't store raw ID numbers)
async function hashIdNumber(idNumber: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(idNumber)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

// GET endpoint to check verification status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const verificationId = request.nextUrl.searchParams.get("id")
    const applicationId = request.nextUrl.searchParams.get("applicationId")

    let query = supabase
      .from("id_verifications")
      .select("id, application_id, primary_id_type, secondary_id_type, status, submitted_at, reviewed_at, notes")
      .eq("user_id", user.id)

    if (verificationId) {
      query = query.eq("id", verificationId)
    } else if (applicationId) {
      query = query.eq("application_id", applicationId)
    }

    const { data: verifications, error } = await query.order("submitted_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch verifications:", error)
      return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 })
    }

    return NextResponse.json({ verifications: verifications || [] })

  } catch (error) {
    console.error("Error fetching verifications:", error)
    return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 })
  }
}

function validateIdImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "unsupported file type. Allowed types: JPEG, PNG, WEBP"
  }

  if (file.size > MAX_ID_IMAGE_SIZE_BYTES) {
    return "file is too large. Maximum size is 10MB"
  }

  return null
}

async function cleanupUploadedBlobs(paths: string[]) {
  if (paths.length === 0) {
    return
  }

  try {
    await del(paths)
  } catch (cleanupError) {
    console.error("Failed to cleanup uploaded blobs:", cleanupError)
  }
}
