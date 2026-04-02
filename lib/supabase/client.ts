'use client'

import { createBrowserClient } from '@supabase/ssr'

// Hardcoded correct Supabase URL - env var keeps getting wrong value
const SUPABASE_URL = 'https://ldervbcvkoawwknsemuz.supabase.co'

export function createClient() {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseAnonKey) {
    console.warn(
      'Missing Supabase anon key. Auth features will be disabled. Please connect Supabase in Settings.'
    )
    return null
  }

  return createBrowserClient(SUPABASE_URL, supabaseAnonKey)
}
