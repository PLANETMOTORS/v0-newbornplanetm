import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Hardcoded correct Supabase URL - env var keeps getting wrong value
const SUPABASE_URL = 'https://ldervbcvkoawwknsemuz.supabase.co'
type CookieMutation = {
  name: string
  value: string
  options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2]
}

export async function createClient() {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing Supabase anon key. Please connect Supabase in Settings.'
    )
  }

  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: CookieMutation[]) {
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
