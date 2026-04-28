// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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
  // Strip emails / phone numbers / Stripe secrets / JWTs / card-shaped
  // digits from every event and breadcrumb before they leave the server.
  beforeSend(event) {
    return redactSentryEvent(event)
  },
  beforeBreadcrumb(crumb) {
    return redactSentryBreadcrumb(crumb)
  },
  // Sentry will be a no-op when dsn is undefined
})
