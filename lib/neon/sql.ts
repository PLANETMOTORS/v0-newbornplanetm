/**
 * lib/neon/sql.ts
 *
 * Tiny, dependency-free wrapper around the Neon serverless driver.
 *
 * The Neon driver speaks raw Postgres over HTTPS, so it works against ANY
 * Postgres host (Neon, Supabase, AWS RDS, etc.) — not just Neon. We keep the
 * `lib/neon/` path for historical reasons but the real source of truth for
 * vehicles in production is Supabase Postgres.
 *
 * Connection string resolution order (first match wins):
 *   1. DATABASE_URL          — explicit override, highest priority
 *   2. POSTGRES_URL          — auto-set by the Vercel ↔ Supabase integration
 *   3. NEON_DATABASE_URL     — auto-set by the Vercel ↔ Neon integration
 *   4. NEON_POSTGRES_URL     — older Neon naming
 *
 * Why this lives in its own module:
 *   - The original `getSql()` lived in `lib/homenet/parser.ts`, which also
 *     pulls in 600+ lines of CSV parsing and column-mapping logic.
 *   - Hot endpoints (e.g. `/api/health`) only need the SQL tag — importing
 *     them from the parser inflates cold-start work and bundle size.
 *   - This module has zero side effects and no transitive dependencies
 *     beyond `@neondatabase/serverless`, so it stays cheap to import.
 *
 * Returns `null` when none of the four env vars are configured. Callers must
 * handle the null case (the health probe, for example, returns 503).
 */

import { neon } from "@neondatabase/serverless"

export type SqlClient = ReturnType<typeof neon>

export function getSql(): SqlClient | null {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_POSTGRES_URL
  if (!url) return null
  return neon(url)
}
