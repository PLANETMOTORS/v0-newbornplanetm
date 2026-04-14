// This file configures the initialization of Sentry for edge features (Middleware, Edge Routes).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      debug: false,
    })
  }).catch(() => {
    // @sentry/nextjs not installed
  })
}

export {}
