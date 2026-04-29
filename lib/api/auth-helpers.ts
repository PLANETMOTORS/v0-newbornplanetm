import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { supabase, user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const
  }
  return { supabase, user, error: null } as const
}

export async function getProfileField<T>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  field: string,
  errorMessage: string,
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(field)
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    return { profile: null, error: NextResponse.json({ error: errorMessage }, { status: 500 }) } as const
  }
  return { profile: profile as T | null, error: null } as const
}

export async function getAuthenticatedAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return { supabase, user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const
  }
  return { supabase, user, error: null } as const
}
