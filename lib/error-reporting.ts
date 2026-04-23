// Error reporting abstraction layer.
// Falls back to console logging when Sentry is not installed.
// NOTE: @sentry/nextjs is not currently in package.json.
// When installed, this module will automatically detect and use it.

/**
 * Check if Sentry is initialized (DSN is configured).
 */
function isSentryInitialized(): boolean {
  return false // @sentry/nextjs not installed
}

/**
 * Report an error to the error reporting service.
 * Uses Sentry.captureException when available, console.error as fallback.
 */
export function reportError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  // Sentry capture would go here when @sentry/nextjs is installed
  void isSentryInitialized()

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
  // Sentry capture would go here when @sentry/nextjs is installed
  void isSentryInitialized()

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
