 
/**
 * lib/supabase/server.ts
 *
 * Supabase SSR client — Next.js App Router
 *
 * Uses @supabase/ssr for proper cookie handling in Server Components,
 * Route Handlers, and Server Actions.
 *
 * Usage:
 *   // Server Component / Route Handler
 *   const sb = await createClient()
 *   const { data: { user } } = await sb.auth.getUser()
 *
 *   // Service-role operations (webhooks, Edge Function proxies)
 *   const admin = createAdminClient()
 *   await admin.from('deals').insert(...)
 */

import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

// ── SSR client (anon key, cookie-based session) ────────────────────────────

/**
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Reads/writes the session from Next.js cookies.
 *
 * Always call `await sb.auth.getUser()` — never trust `getSession()` on
 * the server (it doesn't re-validate the JWT with Supabase Auth).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (all: Array<{ name: string; value: string; options?: Record<string, unknown> }>) =>
        all.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
        ),
    },
  })
}

// ── Admin client (service role, bypasses RLS) ──────────────────────────────

/**
 * Creates a Supabase client with the service role key.
 * Bypasses RLS — use ONLY in:
 *   - Webhook handlers (Stripe, Twilio, RouteOne)
 *   - Edge Functions
 *   - Server-side cron jobs
 *   - Admin API routes (after verifying is_staff())
 *
 * Never expose this client to the browser.
 */
export function createAdminClient() {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ── Auth helpers ───────────────────────────────────────────────────────────

/**
 * Returns the authenticated user or null. Safe for Server Components.
 * Uses getUser() (validates JWT with Supabase Auth server) not getSession().
 */
export async function getAuthUser() {
  const sb = await createClient()
  const { data: { user }, error } = await sb.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * Returns the customer row for the authenticated user, or null.
 * Includes lifecycle, assigned staff, and preferences.
 */
export async function getCustomer() {
  const user = await getAuthUser()
  if (!user) return null

  const sb = await createClient()
  const { data } = await sb
    .from("customers")
    .select(`
      *,
      assigned_sales:staff_members!assigned_sales_user_id(display_name, title, avatar_url),
      assigned_finance:staff_members!assigned_finance_user_id(display_name, title, avatar_url)
    `)
    .eq("user_id", user.id)
    .single()

  return data
}

/**
 * Returns active deals for the authenticated user with related data.
 * Used by the Garage page to show deal status.
 */
export async function getActiveDeals() {
  const user = await getAuthUser()
  if (!user) return []

  const sb = await createClient()
  const { data } = await sb
    .from("deals_public")
    .select(`
      *,
      finance_applications(state, lender, apr_bps, term_months, stips_outstanding),
      deliveries(state, scheduled_for, delivered_at, method, tracking_milestones),
      deposits(state, amount_cents, paid_at)
    `)
    .eq("user_id", user.id)
    .not("stage", "in", '("closed","cancelled")')
    .order("created_at", { ascending: false })

  return data ?? []
}

/**
 * Returns vehicle dossiers owned by the authenticated user.
 * Includes Aviloo SOH history and documents.
 */
export async function getOwnedVehicleDossiers() {
  const user = await getAuthUser()
  if (!user) return []

  const sb = await createClient()
  const { data } = await sb
    .from("vehicle_dossiers")
    .select(`
      *,
      aviloo_soh_history(tested_at, soh_pct, capacity_kwh),
      dossier_documents(id, kind, title, issued_at, metadata, customer_acknowledged_at)
    `)
    .eq("current_owner_user_id", user.id)
    .order("created_at", { ascending: false })

  return data ?? []
}
