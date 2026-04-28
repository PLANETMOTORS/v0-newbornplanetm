// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"
import {
  redactSentryBreadcrumb,
  redactSentryEvent,
} from "@/lib/security/sentry-redaction"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  sendDefaultPii: false,
  integrations: [
    Sentry.replayIntegration({
      // Mask any text and block all media in Replay sessions so a
      // recording of a checkout page never captures card numbers,
      // emails, or VINs.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event) {
    return redactSentryEvent(event)
  },
  beforeBreadcrumb(crumb) {
    return redactSentryBreadcrumb(crumb)
  },
  debug: false,
  // Sentry will be a no-op when dsn is undefined
})
