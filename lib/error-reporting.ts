// Error reporting abstraction layer.
// To enable Sentry: pnpm add @sentry/nextjs, then replace console calls with Sentry.captureException

/**
 * Report an error to the error reporting service.
 * Currently logs to console; swap implementation for Sentry/Datadog/etc.
 */
export function reportError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  // TODO: Replace with Sentry.captureException(error, { extra: context })
  if (context) {
    console.error("[reportError]", error, context)
  } else {
    console.error("[reportError]", error)
  }
}

/**
 * Report a message to the error reporting service.
 * Currently logs to console; swap implementation for Sentry/Datadog/etc.
 */
export function reportMessage(
  message: string,
  level: "info" | "warning" | "error",
  context?: Record<string, unknown>,
): void {
  // TODO: Replace with Sentry.captureMessage(message, { level, extra: context })
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
