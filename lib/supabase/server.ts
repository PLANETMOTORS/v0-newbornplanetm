import { cookies } from 'next/headers'

type SupabaseClient = Awaited<ReturnType<typeof import('@supabase/ssr')['createServerClient']>>

export async function createClient(): Promise<SupabaseClient> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not configured')
  }

  const { createServerClient } = await import('@supabase/ssr')
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  )
}

export async function getServerClient(): Promise<SupabaseClient | null> {
  try {
    return await createClient()
  } catch {
    return null
  }
}
