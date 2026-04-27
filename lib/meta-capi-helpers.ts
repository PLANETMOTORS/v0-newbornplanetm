/**
 * Meta CAPI helper functions for extracting request context
 * and firing common events from API routes.
 */

import { type NextRequest } from "next/server"
import { sendMetaEvent, type MetaEvent, type MetaEventName } from "./meta-capi"

// ── Extract request context ────────────────────────────────────────────────

export function extractRequestContext(request: Request | NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") || ""
  const clientIp = forwarded.split(",")[0]?.trim() || undefined
  const userAgent = request.headers.get("user-agent") || undefined
  const referer = request.headers.get("referer") || undefined

  // Extract Facebook cookies if forwarded in headers
  const cookieHeader = request.headers.get("cookie") || ""
  const fbc = extractCookie(cookieHeader, "_fbc")
  const fbp = extractCookie(cookieHeader, "_fbp")

  return { clientIp, userAgent, referer, fbc, fbp }
}

function extractCookie(cookieHeader: string, name: string): string | undefined {
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(cookieHeader)
  return match?.[1] || undefined
}

// ── Pre-built event helpers ────────────────────────────────────────────────

/** Fire a Lead event when a contact form, financing app, or inquiry is submitted */
export function trackLead(
  request: Request | NextRequest,
  opts: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    value?: number
    contentName?: string
    contentCategory?: string
  }
) {
  const ctx = extractRequestContext(request)
  return fireEvent(request, "Lead", ctx, opts)
}

/** Fire a ViewContent event when a vehicle detail page is viewed */
export function trackViewContent(
  request: Request | NextRequest,
  opts: {
    contentName: string
    contentIds?: string[]
    contentCategory?: string
    value?: number
  }
) {
  const ctx = extractRequestContext(request)
  return fireEvent(request, "ViewContent", ctx, {
    ...opts,
    contentType: "vehicle",
  })
}

/** Fire an InitiateCheckout event when a reservation/deposit is started */
export function trackInitiateCheckout(
  request: Request | NextRequest,
  opts: {
    email?: string
    phone?: string
    firstName?: string
    contentName?: string
    contentIds?: string[]
    value?: number
  }
) {
  const ctx = extractRequestContext(request)
  return fireEvent(request, "InitiateCheckout", ctx, opts)
}

/** Fire a Schedule event when a test drive or video call is booked */
export function trackSchedule(
  request: Request | NextRequest,
  opts: {
    email?: string
    phone?: string
    firstName?: string
    contentName?: string
  }
) {
  const ctx = extractRequestContext(request)
  return fireEvent(request, "Schedule", ctx, opts)
}

// ── Internal ───────────────────────────────────────────────────────────────

function fireEvent(
  request: Request | NextRequest,
  eventName: MetaEventName,
  ctx: ReturnType<typeof extractRequestContext>,
  opts: Record<string, unknown>
) {
  const event: MetaEvent = {
    eventName,
    eventSourceUrl: ctx.referer || undefined,
    userData: {
      email: opts.email as string | undefined,
      phone: opts.phone as string | undefined,
      firstName: opts.firstName as string | undefined,
      lastName: opts.lastName as string | undefined,
      clientIpAddress: ctx.clientIp,
      clientUserAgent: ctx.userAgent,
      fbc: ctx.fbc,
      fbp: ctx.fbp,
      country: "ca",
    },
    customData: {
      value: opts.value as number | undefined,
      currency: opts.value ? "CAD" : undefined,
      contentName: opts.contentName as string | undefined,
      contentCategory: opts.contentCategory as string | undefined,
      contentIds: opts.contentIds as string[] | undefined,
      contentType: opts.contentType as string | undefined,
    },
  }

  // Fire-and-forget — don't block the API response
  sendMetaEvent(event).catch((err) =>
    console.error(`[Meta CAPI] Failed to send ${eventName}:`, err)
  )
}
