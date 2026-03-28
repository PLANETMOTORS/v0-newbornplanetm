type SupabaseClient = Awaited<ReturnType<typeof import('@supabase/ssr')['createBrowserClient']>>

let client: SupabaseClient | null = null

export async function createClient(): Promise<SupabaseClient> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not configured. Please connect Supabase in Settings.')
  }

  if (client) return client

  const { createBrowserClient } = await import('@supabase/ssr')
  
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  return client
}

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  try {
    return await createClient()
  } catch {
    return null
  }
}
