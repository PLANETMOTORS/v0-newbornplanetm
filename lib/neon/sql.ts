/**
 * lib/neon/sql.ts
 *
 * Tiny wrapper around the postgres.js (`postgres`) driver.
 *
 * Why postgres.js and not @neondatabase/serverless?
 *   - The Neon serverless driver communicates over HTTPS to a Neon-only
 *     proxy. It does NOT work against Supabase, AWS RDS, or any vanilla
 *     Postgres host. Our production database is Supabase Postgres — so
 *     this module needs a TCP-capable driver.
 *   - postgres.js is tiny (~140KB), has the identical tagged-template
 *     API (`await sql\`SELECT ...\``), and works on any Postgres host.
 *   - We intentionally keep the `lib/neon/` path and the `SqlClient`
 *     type name for backwards compatibility — every caller in
 *     lib/homenet/* and app/api/cron/* keeps working unchanged.
 *
 * Connection string resolution order (first match wins):
 *   1. DATABASE_URL          — explicit override, highest priority
 *   2. POSTGRES_URL          — auto-set by the Vercel ↔ Supabase integration
 *   3. NEON_DATABASE_URL     — legacy, for safety during cutover
 *   4. NEON_POSTGRES_URL     — legacy, older Neon naming
 *
 * Connection options chosen for Supabase Transaction pooler (port 6543):
 *   - `prepare: false`        Required — tx pooler does not support
 *                             prepared statements.
 *   - `max: 1`                One connection per serverless invocation.
 *                             The pooler handles concurrency for us.
 *   - `idle_timeout: 20`      Close idle conns quickly so cold starts
 *                             don't hold pool slots.
 *   - `connect_timeout: 10`   Fail fast if pooler is unreachable.
 *
 * Returns `null` when none of the four env vars are configured. Callers
 * must handle the null case (the health probe returns 503).
 */

import postgres, { type Sql } from "postgres"

export type SqlClient = Sql

const POSTGRES_OPTIONS = {
  prepare: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
} as const

export function getSql(): SqlClient | null {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_POSTGRES_URL
  if (!url) return null
  return postgres(url, POSTGRES_OPTIONS)
}
