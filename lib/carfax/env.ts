/**
 * Validated environment configuration for the Carfax Canada Badging API.
 *
 * Why fail loud here?
 * -------------------
 * The Badging API requires four secrets (auth URL, API URL, client_id,
 * client_secret) plus the dealership's 5-digit account number. If any of
 * these are missing in production we want a clear, single-source error
 * thrown at boot rather than a confusing 401/403 chain at request time.
 *
 * The function returns null in non-production environments when secrets
 * are absent so the rest of the app (and CI) can boot without them. The
 * call sites then short-circuit to a "carfax disabled" path.
 */

import { z } from "zod"

const carfaxEnvSchema = z.object({
  CARFAX_AUTH_URL: z.string().url(),
  CARFAX_API_URL: z.string().url(),
  CARFAX_AUDIENCE: z.string().url(),
  CARFAX_CLIENT_ID: z.string().min(8),
  CARFAX_CLIENT_SECRET: z.string().min(16),
  CARFAX_ACCOUNT_NUMBER: z.string().regex(/^\d{4,6}$/, "must be 4-6 digit account number"),
})

export type CarfaxEnv = z.infer<typeof carfaxEnvSchema>

/**
 * Read + validate Carfax env. Returns null when any var is missing —
 * the caller should treat null as "Carfax integration disabled".
 *
 * In production this should never happen; the cron + admin re-fetch
 * endpoints will refuse to run when null. The VDP route falls back to
 * a no-API-call render (no badges, no link).
 */
export function readCarfaxEnv(): CarfaxEnv | null {
  const candidate = {
    CARFAX_AUTH_URL: process.env.CARFAX_AUTH_URL,
    CARFAX_API_URL: process.env.CARFAX_API_URL,
    CARFAX_AUDIENCE: process.env.CARFAX_AUDIENCE,
    CARFAX_CLIENT_ID: process.env.CARFAX_CLIENT_ID,
    CARFAX_CLIENT_SECRET: process.env.CARFAX_CLIENT_SECRET,
    CARFAX_ACCOUNT_NUMBER: process.env.CARFAX_ACCOUNT_NUMBER,
  }
  // Treat empty strings as missing so .env.local placeholders don't slip through
  const allPresent = Object.values(candidate).every((v) => typeof v === "string" && v.length > 0)
  if (!allPresent) return null
  const parsed = carfaxEnvSchema.safeParse(candidate)
  if (!parsed.success) return null
  return parsed.data
}

/**
 * Stricter variant: throws on missing/invalid env. Use from cron jobs and
 * admin endpoints where you'd rather fail fast than render a degraded UI.
 */
export function requireCarfaxEnv(): CarfaxEnv {
  const env = readCarfaxEnv()
  if (env) return env
  throw new Error(
    "Carfax env vars missing or invalid: set CARFAX_AUTH_URL, CARFAX_API_URL, " +
      "CARFAX_AUDIENCE, CARFAX_CLIENT_ID, CARFAX_CLIENT_SECRET, CARFAX_ACCOUNT_NUMBER",
  )
}
