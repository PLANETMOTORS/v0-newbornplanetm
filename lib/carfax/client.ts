/**
 * HTTP client for the Carfax Canada Badging API v3.
 *
 * Surface
 * -------
 *   fetchToken(env)     — POST /oauth/token (Auth0 client_credentials)
 *   fetchBadges(env,vin) — read-through cache → /api/v3/badges
 *
 * All operations return Result<T, CarfaxClientError>. Shared HTTP
 * primitives (VIN regex, AbortController timeout, JSON+Zod validation)
 * live in ./http.ts so this file contains only the call-specific glue.
 */

import type { Result } from "@/lib/result"
import { err, ok } from "@/lib/result"
import {
  type CarfaxBadgeSummary,
  badgesResponseSchema,
  tokenResponseSchema,
} from "./schemas"
import { envelopeToSummary } from "./adapters"
import { getCachedToken, storeToken } from "./token-cache"
import type { CarfaxEnv } from "./env"
import {
  type FetchLike,
  type HttpError,
  fetchWithTimeout,
  normaliseVin,
  readJsonAndValidate,
} from "./http"

export type CarfaxClientError =
  | HttpError
  | { readonly kind: "invalid-vin"; readonly vin: string }
  | { readonly kind: "config-missing" }

const TOKEN_TIMEOUT_MS = 8_000
const BADGES_TIMEOUT_MS = 6_000

/** Re-export so route handlers do not need to import http.ts directly. */
export { normaliseVin } from "./http"

// ── Token mint ──────────────────────────────────────────────────────────

export async function fetchToken(
  env: CarfaxEnv,
  fetchImpl: FetchLike = fetch,
): Promise<Result<string, CarfaxClientError>> {
  const body = new URLSearchParams({
    audience: env.CARFAX_AUDIENCE,
    grant_type: "client_credentials",
    client_id: env.CARFAX_CLIENT_ID,
    client_secret: env.CARFAX_CLIENT_SECRET,
  })

  const responseResult = await fetchWithTimeout(
    fetchImpl,
    env.CARFAX_AUTH_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    TOKEN_TIMEOUT_MS,
  )
  if (!responseResult.ok) return responseResult

  const validated = await readJsonAndValidate(responseResult.value, tokenResponseSchema)
  if (!validated.ok) return validated

  storeToken(env.CARFAX_CLIENT_ID, validated.value)
  return ok(validated.value.access_token)
}

async function getOrMintToken(
  env: CarfaxEnv,
  fetchImpl: FetchLike,
): Promise<Result<string, CarfaxClientError>> {
  const cached = getCachedToken(env.CARFAX_CLIENT_ID)
  if (cached) return ok(cached)
  return fetchToken(env, fetchImpl)
}

// ── Badge fetch ─────────────────────────────────────────────────────────

export async function fetchBadges(
  env: CarfaxEnv,
  vin: string,
  fetchImpl: FetchLike = fetch,
  nowIso: () => string = () => new Date().toISOString(),
): Promise<Result<CarfaxBadgeSummary, CarfaxClientError>> {
  const normalisedVin = normaliseVin(vin)
  if (!normalisedVin) return err({ kind: "invalid-vin", vin })

  const tokenResult = await getOrMintToken(env, fetchImpl)
  if (!tokenResult.ok) return tokenResult

  const url = new URL(`${env.CARFAX_API_URL.replace(/\/$/, "")}/badges`)
  url.searchParams.set("CompanyId", env.CARFAX_ACCOUNT_NUMBER)
  url.searchParams.set("Vin", normalisedVin)
  url.searchParams.set("HideVin", "false")

  const responseResult = await fetchWithTimeout(
    fetchImpl,
    url.toString(),
    {
      method: "GET",
      headers: {
        accept: "application/json",
        Auth0CarfaxCanadaJWTBearer: tokenResult.value,
      },
    },
    BADGES_TIMEOUT_MS,
  )
  if (!responseResult.ok) return responseResult

  const validated = await readJsonAndValidate(responseResult.value, badgesResponseSchema)
  if (!validated.ok) return validated

  return ok(envelopeToSummary(validated.value, normalisedVin, nowIso()))
}
