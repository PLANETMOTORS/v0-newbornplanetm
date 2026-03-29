import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Hardcoded correct Supabase URL to fix OAuth redirect issue
const SUPABASE_URL = 'https://ldervbcvkoawwknsemuz.supabase.co'

export async function createClient() {
  const supabaseUrl = SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing Supabase anon key. Please connect Supabase in Settings.'
    )
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}
