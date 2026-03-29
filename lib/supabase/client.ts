'use client'

import { createBrowserClient } from '@supabase/ssr'

// Hardcoded correct Supabase URL to fix OAuth redirect issue
const SUPABASE_URL = 'https://ldervbcvkoawwknsemuz.supabase.co'

export function createClient() {
  const supabaseUrl = SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing Supabase anon key. Please connect Supabase in Settings.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
