// This file configures the initialization of Sentry for edge features (Middleware, Edge Routes).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"
import {
  redactSentryBreadcrumb,
  redactSentryEvent,
} from "@/lib/security/sentry-redaction"

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  debug: false,
  sendDefaultPii: false,
  beforeSend(event) {
    return redactSentryEvent(event)
  },
  beforeBreadcrumb(crumb) {
    return redactSentryBreadcrumb(crumb)
  },
  // Sentry will be a no-op when dsn is undefined
})
