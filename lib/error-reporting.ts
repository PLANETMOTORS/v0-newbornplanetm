/**
 * lib/error-reporting.ts
 *
 * Sentry-backed error reporting with structured context.
 *
 * Uses the typed error taxonomy from lib/errors.ts:
 *   - AppError subclasses with reportable=false are NOT sent to Sentry
 *     (e.g. VehicleNotFoundError, ValidationError — expected user errors)
 *   - AppError subclasses with reportable=true ARE sent to Sentry
 *     (e.g. SanityFetchError, InternalError — unexpected system errors)
 *   - Unknown errors are always sent to Sentry
 *
 * Sentry fingerprinting: errors are grouped by error.name (class name),
 * not by message, so "VehicleNotFoundError" groups together regardless
 * of which VIN triggered it.
 */

import * as Sentry from "@sentry/nextjs"
import { AppError } from "@/lib/errors"

// ── Core reporting ─────────────────────────────────────────────────────────

/**
 * Report an error to Sentry with structured context.
 *
 * - AppError with reportable=false: skipped (expected user-facing errors)
 * - AppError with reportable=true: sent with error.context as Sentry extras
 * - Unknown errors: always sent
 *
 * @param error  The error to report
 * @param extra  Additional key-value context merged with error.context
 */
export function reportError(
  error: unknown,
  extra?: Record<string, unknown>
): void {
  // Typed AppError — check reportable flag
  if (error instanceof AppError) {
    if (!error.reportable) {
      // Expected error (404, validation, auth) — log locally only
      console.warn(`[${error.name}] ${error.message}`, error.context)
      return
    }

    // Reportable system error — send to Sentry with full context
    Sentry.withScope((scope) => {
      scope.setTag("error.type", error.name)
      scope.setTag("error.statusCode", String(error.statusCode))
      scope.setExtras({ ...error.context, ...extra })
      // Fingerprint by class name so Sentry groups by error type
      scope.setFingerprint([error.name, error.message])
      Sentry.captureException(error)
    })

    console.error(`[${error.name}] ${error.message}`, error.context)
    return
  }

  // Unknown error — always report
  const err = error instanceof Error ? error : new Error(String(error))
  Sentry.withScope((scope) => {
    scope.setTag("error.type", "UnknownError")
    if (extra) scope.setExtras(extra)
    Sentry.captureException(err)
  })

  console.error("[UnknownError]", err, extra)
}

/**
 * Report a message (non-exception) to Sentry.
 *
 * @param message  Human-readable message
 * @param level    Sentry severity level
 * @param extra    Additional context
 */
export function reportMessage(
  message: string,
  level: "info" | "warning" | "error",
  extra?: Record<string, unknown>
): void {
  const sentryLevel = level === "warning" ? "warning" : level === "error" ? "error" : "info"

  Sentry.withScope((scope) => {
    if (extra) scope.setExtras(extra)
    Sentry.captureMessage(message, sentryLevel)
  })

  const logFn = level === "error" ? console.error : level === "warning" ? console.warn : console.info
  logFn(`[${level.toUpperCase()}] ${message}`, extra ?? "")
}

/**
 * Add breadcrumb for user action tracking in Sentry.
 * Breadcrumbs appear in the Sentry issue timeline.
 *
 * @param message   What happened
 * @param category  e.g. "navigation", "ui.click", "api"
 * @param data      Additional structured data
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({ message, category, data, level: "info" })
}

/**
 * Set the current user context in Sentry.
 * Call this after authentication.
 *
 * @param user  User identity (id, email) — never include passwords or tokens
 */
export function setSentryUser(user: { id: string; email?: string } | null): void {
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Wrap an async function with Sentry error capture.
 * Returns undefined on error instead of throwing.
 *
 * Usage:
 *   const data = await withErrorCapture(
 *     () => fetchVehicles(),
 *     { operation: "fetchVehicles" }
 *   )
 */
export async function withErrorCapture<T>(
  fn: () => Promise<T>,
  extra?: Record<string, unknown>
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (err) {
    reportError(err, extra)
    return undefined
  }
}
