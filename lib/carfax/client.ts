/**
 * HTTP client for the Carfax Canada Badging API v3.
 *
 * Surface
 * -------
 *   fetchToken()         — POST /oauth/token (Auth0 client_credentials)
 *   getOrMintToken()     — read-through cache around fetchToken
 *   fetchBadges(vin)     — GET  /api/v3/badges?CompanyId=&Vin=&HideVin=
 *
 * All operations return Result<T, CarfaxClientError> — never throw across
 * the IO boundary so the route handler stays linear and the failure mode
 * is always typed.
 *
 * Design choices
 * --------------
 * - VIN normalisation (uppercase, trim) happens once at the public edge
 *   so the cache key is stable.
 * - HideVin is hard-coded to false because every dealer-public listing on
 *   PlanetMotors already shows the VIN; flipping it later would be a
 *   compliance question, not a code change.
 * - Network timeouts are explicit (8s for token, 6s for badges) so a
 *   misbehaving Carfax never blocks a VDP render.
 * - We pass `fetchImpl` as a parameter so unit tests inject a mock
 *   without polyfilling global fetch.
 */

import { z } from "zod"
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

export type CarfaxClientError =
  | { readonly kind: "config-missing" }
  | { readonly kind: "invalid-vin"; readonly vin: string }
  | { readonly kind: "auth-failed"; readonly status: number; readonly body: string }
  | { readonly kind: "auth-invalid-response"; readonly issues: string }
  | { readonly kind: "badges-http-error"; readonly status: number; readonly body: string }
  | { readonly kind: "badges-invalid-response"; readonly issues: string }
  | { readonly kind: "network"; readonly message: string }
  | { readonly kind: "timeout" }

const TOKEN_TIMEOUT_MS = 8_000
const BADGES_TIMEOUT_MS = 6_000

type FetchLike = typeof fetch

function describe(error_: unknown): string {
  return error_ instanceof Error ? error_.message : String(error_)
}

function describeIssues(error_: z.ZodError): string {
  return error_.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ")
}

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/

/**
 * Normalise + validate a 17-char VIN. North-American VINs use letters
 * minus I/O/Q to avoid 1/0 confusion — anything else is a typo or
 * partial value and we refuse before contacting Carfax.
 */
export function normaliseVin(raw: string): Result<string, CarfaxClientError> {
  const trimmed = raw.trim().toUpperCase()
  if (!VIN_RE.test(trimmed)) return err({ kind: "invalid-vin", vin: raw })
  return ok(trimmed)
}

async function withTimeout<T>(p: Promise<T>, timeoutMs: number): Promise<Result<T, CarfaxClientError>> {
  let timer: ReturnType<typeof setTimeout> | null = null
  try {
    const raced = await Promise.race([
      p.then((value) => ({ kind: "value" as const, value })),
      new Promise<{ kind: "timeout" }>((resolve) => {
        timer = setTimeout(() => resolve({ kind: "timeout" }), timeoutMs)
      }),
    ])
    if (raced.kind === "timeout") return err({ kind: "timeout" })
    return ok(raced.value)
  } catch (e) {
    return err({ kind: "network", message: describe(e) })
  } finally {
    if (timer !== null) clearTimeout(timer)
  }
}

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

  const responseResult = await withTimeout(
    fetchImpl(env.CARFAX_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }),
    TOKEN_TIMEOUT_MS,
  )
  if (!responseResult.ok) return responseResult

  const response = responseResult.value
  const text = await response.text()

  if (!response.ok) {
    return err({ kind: "auth-failed", status: response.status, body: text.slice(0, 500) })
  }

  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    return err({ kind: "auth-invalid-response", issues: "non-JSON body" })
  }

  const parsed = tokenResponseSchema.safeParse(payload)
  if (!parsed.success) {
    return err({ kind: "auth-invalid-response", issues: describeIssues(parsed.error) })
  }

  storeToken(env.CARFAX_CLIENT_ID, parsed.data)
  return ok(parsed.data.access_token)
}

/**
 * Read-through cache: returns the cached token if still fresh, otherwise
 * mints a new one and persists it for subsequent calls.
 */
export async function getOrMintToken(
  env: CarfaxEnv,
  fetchImpl: FetchLike = fetch,
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
  const vinResult = normaliseVin(vin)
  if (!vinResult.ok) return vinResult

  const tokenResult = await getOrMintToken(env, fetchImpl)
  if (!tokenResult.ok) return tokenResult

  const url = new URL(`${env.CARFAX_API_URL.replace(/\/$/, "")}/badges`)
  url.searchParams.set("CompanyId", env.CARFAX_ACCOUNT_NUMBER)
  url.searchParams.set("Vin", vinResult.value)
  url.searchParams.set("HideVin", "false")

  const responseResult = await withTimeout(
    fetchImpl(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
        Auth0CarfaxCanadaJWTBearer: tokenResult.value,
      },
    }),
    BADGES_TIMEOUT_MS,
  )
  if (!responseResult.ok) return responseResult

  const response = responseResult.value
  const text = await response.text()

  if (!response.ok) {
    return err({ kind: "badges-http-error", status: response.status, body: text.slice(0, 500) })
  }

  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    return err({ kind: "badges-invalid-response", issues: "non-JSON body" })
  }

  const parsed = badgesResponseSchema.safeParse(payload)
  if (!parsed.success) {
    return err({ kind: "badges-invalid-response", issues: describeIssues(parsed.error) })
  }

  return ok(envelopeToSummary(parsed.data, vinResult.value, nowIso()))
}
