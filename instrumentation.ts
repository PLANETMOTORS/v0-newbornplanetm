export async function register() {
  try {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("./sentry.server.config")
    }
    if (process.env.NEXT_RUNTIME === "edge") {
      await import("./sentry.edge.config")
    }
  } catch {
    // @sentry/nextjs not installed — skip Sentry instrumentation
  }
}

export const onRequestError = async (...args: unknown[]) => {
  try {
    const { captureRequestError } = await import("@sentry/nextjs")
    // @ts-expect-error -- Sentry's captureRequestError expects specific args from Next.js
    return captureRequestError(...args)
  } catch {
    // @sentry/nextjs not installed — skip error capture
  }
}
