// Error reporting abstraction layer.
// Uses Sentry when DSN is configured, falls back to console logging.

import * as Sentry from "@sentry/nextjs"

/**
 * Check if Sentry is initialized (DSN is configured).
 */
function isSentryInitialized(): boolean {
  return !!Sentry.getClient()
}

/**
 * Report an error to the error reporting service.
 * Uses Sentry.captureException when available, console.error as fallback.
 */
export function reportError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  if (isSentryInitialized()) {
    Sentry.captureException(error, {
      extra: context,
    })
  }

  // Always log to console for local development visibility
  if (context) {
    console.error("[reportError]", error, context)
  } else {
    console.error("[reportError]", error)
  }
}

/**
 * Report a message to the error reporting service.
 * Uses Sentry.captureMessage when available, console as fallback.
 */
export function reportMessage(
  message: string,
  level: "info" | "warning" | "error",
  context?: Record<string, unknown>,
): void {
  if (isSentryInitialized()) {
    Sentry.captureMessage(message, {
      level: level as Sentry.SeverityLevel,
      extra: context,
    })
  }

  // Always log to console for local development visibility
  const logFn =
    level === "error"
      ? console.error
      : level === "warning"
        ? console.warn
        : console.info

  if (context) {
    logFn(`[reportMessage:${level}]`, message, context)
  } else {
    logFn(`[reportMessage:${level}]`, message)
  }
}
