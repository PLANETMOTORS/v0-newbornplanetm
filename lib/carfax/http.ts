/**
 * Shared HTTP primitives for the Carfax client. Owns:
 *
 *   - VIN normalisation (uppercase + 17-char NA regex)
 *   - fetchWithTimeout — AbortController-backed cancellation so a slow
 *     Carfax response actually closes the underlying TCP/TLS socket
 *     instead of leaking the file descriptor for serverless lifetime
 *   - readJsonAndValidate — a single source of truth for the
 *     "fetch -> .text() -> JSON.parse -> z.safeParse" pattern, used by
 *     both fetchToken() and fetchBadges().
 *
 * Centralising these primitives is the architectural reason there is
 * NO duplication between the two HTTP code paths.
 */

import type { z } from "zod"
import type { Result } from "@/lib/result"
import { err, ok } from "@/lib/result"

export type FetchLike = typeof fetch

/**
 * Errors that can leak out of the shared HTTP primitives. Concrete
 * Carfax error kinds (auth-failed / badges-http-error / …) are produced
 * by the per-call wrappers in client.ts; this type represents only the
 * primitive failure modes.
 */
export type HttpError =
  | { readonly kind: "network"; readonly message: string }
  | { readonly kind: "timeout" }
  | { readonly kind: "http-error"; readonly status: number; readonly body: string }
  | { readonly kind: "non-json" }
  | { readonly kind: "schema-mismatch"; readonly issues: string }

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/

/**
 * Normalise + validate a North-American 17-char VIN. NA VINs use letters
 * minus I/O/Q (avoiding 1/0 confusion). Anything else is rejected before
 * we contact Carfax so we never leak a malformed VIN out of the dealership.
 */
export function normaliseVin(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase()
  return VIN_RE.test(trimmed) ? trimmed : null
}

function describeException(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}

function describeIssues(error_: z.ZodError): string {
  return error_.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ")
}

/**
 * Run a single fetch with an enforced timeout. On timeout the underlying
 * request is aborted via AbortController, freeing the socket immediately.
 */
export async function fetchWithTimeout(
  fetchImpl: FetchLike,
  url: string | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Result<Response, HttpError>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal })
    return ok(response)
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return err({ kind: "timeout" })
    }
    return err({ kind: "network", message: describeException(e) })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Read a Response body, ensure it is JSON that matches the supplied
 * Zod schema, and return the validated value. Used by both the token
 * mint and the badges call so neither has to repeat the boilerplate.
 *
 * Error bodies are truncated to 500 chars so logs don't accidentally
 * include a megabyte of HTML when Carfax fronts an upstream proxy.
 */
export async function readJsonAndValidate<T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<Result<T, HttpError>> {
  const text = await response.text()
  if (!response.ok) {
    return err({ kind: "http-error", status: response.status, body: text.slice(0, 500) })
  }
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    return err({ kind: "non-json" })
  }
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return err({ kind: "schema-mismatch", issues: describeIssues(parsed.error) })
  }
  return ok(parsed.data)
}
