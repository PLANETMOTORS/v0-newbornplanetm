import { NextRequest, NextResponse } from "next/server"
import { createHash, randomBytes, createCipheriv } from "node:crypto"
import { createClient } from "@/lib/supabase/server"
import { validateOrigin } from "@/lib/csrf"

/**
 * Validate a Canadian Social Insurance Number using the Luhn algorithm.
 * SIN must be 9 digits and pass the Luhn check.
 */
function isValidSin(raw: string): boolean {
  const digits = raw.replace(/\D/g, "")
  if (digits.length !== 9) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    let d = Number(digits[i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

/**
 * Protect the SIN at rest. When APPLICATION_SIN_ENCRYPTION_KEY is configured
 * (a 32-byte hex key), the SIN is encrypted with AES-256-GCM and stored as
 * `enc:v1:iv:authTag:ciphertext`. Otherwise we fall back to a keyed one-way
 * hash (peppered SHA-256) so raw digits are never persisted to the database.
 * PIPEDA requires that SIN be protected at rest; plaintext storage is not
 * acceptable.
 */
function protectSin(rawSin: string): string {
  const digits = rawSin.replace(/\D/g, "")
  const encryptionKeyHex = process.env.APPLICATION_SIN_ENCRYPTION_KEY

  if (encryptionKeyHex && /^[0-9a-f]{64}$/i.test(encryptionKeyHex)) {
    const key = Buffer.from(encryptionKeyHex, "hex")
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", key, iv)
    const encrypted = Buffer.concat([cipher.update(digits, "utf8"), cipher.final()])
    const authTag = cipher.getAuthTag()
    return `enc:v1:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
  }

  // Fallback: peppered one-way hash. Not reversible, but keeps raw PII out of
  // the database when no encryption key has been provisioned yet.
  const pepper = process.env.APPLICATION_SIN_HASH_PEPPER || ""
  return `sha256:${createHash("sha256").update(`${pepper}:${digits}`).digest("hex")}`
}

export async function POST(request: NextRequest) {
  try {
    // Reject cross-origin POSTs (CSRF protection for a browser-facing endpoint)
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Require authentication — applications contain sensitive PII (SIN, DOB,
    // income) and must be tied to an authenticated user.
    let supabase: Awaited<ReturnType<typeof createClient>>
    try {
      supabase = await createClient()
    } catch (err) {
      console.error("[/api/application] Supabase not configured:", err)
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      )
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const required = ["firstName", "lastName", "email", "phone"]
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // If SIN is provided, validate format/Luhn before accepting it.
    if (body.sin && !isValidSin(String(body.sin))) {
      return NextResponse.json({ error: "Invalid SIN" }, { status: 400 })
    }

    const { error: insertError } = await supabase.from("applications").insert({
      user_id: user.id,
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      phone: body.phone,
      date_of_birth: body.dob || null,
      // SIN is never stored in plaintext. See protectSin() for details.
      sin: body.sin ? protectSin(String(body.sin)) : null,
      address: body.address || null,
      city: body.city || null,
      postal_code: body.postal || null,
      province: body.province || null,
      employment_type: body.employmentType || null,
      employer: body.employer || null,
      annual_income: body.income ? Number(body.income) : null,
      job_title: body.jobTitle || null,
      status: "pending",
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("[/api/application] Supabase insert error:", insertError)
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[/api/application] Unhandled error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
