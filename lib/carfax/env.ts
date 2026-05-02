/**
 * Validated environment configuration for the Carfax Canada Badging API.
 *
 * The Badging API requires four secrets (auth URL, API URL, client_id,
 * client_secret) plus the dealership's account number. If any are missing
 * we want a single, clear error rather than a confusing 401/403 chain at
 * request time.
 *
 * The reader returns null when secrets are absent so non-prod / CI can
 * boot cleanly. Call sites short-circuit to a "Carfax disabled" path.
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

export function readCarfaxEnv(): CarfaxEnv | null {
  const candidate = {
    CARFAX_AUTH_URL: process.env.CARFAX_AUTH_URL,
    CARFAX_API_URL: process.env.CARFAX_API_URL,
    CARFAX_AUDIENCE: process.env.CARFAX_AUDIENCE,
    CARFAX_CLIENT_ID: process.env.CARFAX_CLIENT_ID,
    CARFAX_CLIENT_SECRET: process.env.CARFAX_CLIENT_SECRET,
    CARFAX_ACCOUNT_NUMBER: process.env.CARFAX_ACCOUNT_NUMBER,
  }
  // Empty strings count as missing so .env placeholders don't slip through.
  const allPresent = Object.values(candidate).every(
    (v) => typeof v === "string" && v.length > 0,
  )
  if (!allPresent) return null
  const parsed = carfaxEnvSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

/** Stricter variant: throws on missing/invalid env. Use from cron jobs. */
export function requireCarfaxEnv(): CarfaxEnv {
  const env = readCarfaxEnv()
  if (env) return env
  throw new Error(
    "Carfax env vars missing or invalid: set CARFAX_AUTH_URL, CARFAX_API_URL, " +
      "CARFAX_AUDIENCE, CARFAX_CLIENT_ID, CARFAX_CLIENT_SECRET, CARFAX_ACCOUNT_NUMBER",
  )
}
