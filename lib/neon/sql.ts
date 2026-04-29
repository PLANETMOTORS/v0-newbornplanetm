/**
 * lib/neon/sql.ts
 *
 * Tiny, dependency-free wrapper around the Neon serverless driver.
 *
 * Why this lives in its own module:
 *   - The original `getSql()` lived in `lib/homenet/parser.ts`, which also
 *     pulls in 600+ lines of CSV parsing and column-mapping logic.
 *   - Hot endpoints (e.g. `/api/health`) only need the SQL tag — importing
 *     them from the parser inflates cold-start work and bundle size.
 *   - This module has zero side effects and no transitive dependencies
 *     beyond `@neondatabase/serverless`, so it stays cheap to import.
 *
 * Returns `null` when no Neon connection string is configured. Callers must
 * handle the null case (the health probe, for example, returns 503).
 */

import { neon } from "@neondatabase/serverless"

export type SqlClient = ReturnType<typeof neon>

export function getSql(): SqlClient | null {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.NEON_POSTGRES_URL
  if (!url) return null
  return neon(url)
}
