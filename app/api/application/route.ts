import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
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

    // Write to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(supabaseUrl, supabaseKey)

      await supabase.from("applications").insert({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        date_of_birth: body.dob || null,
        sin: body.sin || null,
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
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
