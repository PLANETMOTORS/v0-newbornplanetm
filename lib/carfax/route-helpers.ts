/**
 * Shared route helpers for the public + admin Carfax endpoints.
 *
 * The two routes share three preflight steps (parse VIN, ensure env is
 * configured, format error payloads). Centralising them here keeps the
 * route bodies focused on their distinct flow logic and prevents
 * accidental drift between the two response shapes.
 */

import { NextResponse } from "next/server"
import { type CarfaxEnv, readCarfaxEnv } from "./env"
import { normaliseVin } from "./http"

export type ErrorCode =
  | "INVALID_VIN"
  | "INVALID_QUERY"
  | "RATE_LIMITED"
  | "CARFAX_DISABLED"
  | "CARFAX_UNAVAILABLE"
  | "CARFAX_FETCH_FAILED"
  | "CARFAX_PERSIST_FAILED"

export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  extra: Record<string, unknown> = {},
): NextResponse {
  return NextResponse.json({ error: { code, message, ...extra } }, { status })
}

interface VinAndEnv {
  readonly vin: string
  readonly env: CarfaxEnv
}

/**
 * Validate the VIN slug and read Carfax env. Returns a Result-shaped
 * object (`{ ok, value | response }`) so routes can early-return the
 * NextResponse without crafting it themselves.
 */
export type VinAndEnvResult =
  | { ok: true; value: VinAndEnv }
  | { ok: false; response: NextResponse }

export function gateVinAndEnv(rawVin: string): VinAndEnvResult {
  const vin = normaliseVin(rawVin)
  if (!vin) {
    return {
      ok: false,
      response: errorResponse(
        "INVALID_VIN",
        "VIN must be 17 alphanumeric characters",
        400,
      ),
    }
  }
  const env = readCarfaxEnv()
  if (!env) {
    return {
      ok: false,
      response: errorResponse(
        "CARFAX_DISABLED",
        "Carfax env vars not configured",
        503,
      ),
    }
  }
  return { ok: true, value: { vin, env } }
}
