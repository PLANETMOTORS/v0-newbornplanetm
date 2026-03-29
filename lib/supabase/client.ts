'use client'

import { createBrowserClient } from '@supabase/ssr'

// Hardcoded correct Supabase URL - env var keeps getting wrong value
const SUPABASE_URL = 'https://ldervbcvkoawwknsemuz.supabase.co'

export function createClient() {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing Supabase anon key. Please connect Supabase in Settings.'
    )
  }

  return createBrowserClient(SUPABASE_URL, supabaseAnonKey)
}
