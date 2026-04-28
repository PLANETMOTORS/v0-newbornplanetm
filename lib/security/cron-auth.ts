import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

type CronAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse }

/**
 * Verify the Vercel CRON_SECRET on incoming cron/webhook requests.
 *
 * - **Fail-closed in production:** returns 503 when CRON_SECRET is unset.
 * - **Timing-safe comparison:** uses `crypto.timingSafeEqual` to prevent
 *   side-channel leakage of the secret length or content.
 * - Accepts an optional `secret` override (e.g. TYPESENSE_SYNC_SECRET)
 *   that takes precedence over CRON_SECRET.
 */
export function verifyCronSecret(
  request: Request,
  options?: { secret?: string },
): CronAuthResult {
  const authHeader = request.headers.get("authorization")
  const secret = options?.secret ?? process.env.CRON_SECRET

  if (process.env.NODE_ENV === "production" && !secret) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Server misconfiguration: CRON_SECRET is not set" },
        { status: 503 },
      ),
    }
  }

  if (secret) {
    const expected = `Bearer ${secret}`
    const supplied = authHeader ?? ""
    const a = Buffer.from(expected)
    const b = Buffer.from(supplied)
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        ),
      }
    }
  }

  return { ok: true }
}
