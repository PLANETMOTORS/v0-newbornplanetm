import { createClient } from "@supabase/supabase-js"
import { apiError, ErrorCode } from "@/lib/api-response"

export function createAnonClientOrError() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: apiError(ErrorCode.CONFIG_ERROR, "Server configuration error") } as const
  }
  return { client: createClient(supabaseUrl, supabaseAnonKey) } as const
}
