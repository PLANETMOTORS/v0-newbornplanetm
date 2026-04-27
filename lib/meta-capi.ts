/**
 * Meta Conversions API (CAPI) — Server-Side Event Tracking
 *
 * Sends events directly to Meta's servers, bypassing browser limitations
 * and ad blockers. This improves ad attribution and optimization for
 * Facebook/Instagram campaigns.
 *
 * Required env vars:
 *   META_CAPI_ACCESS_TOKEN — System User access token from Meta Business Manager
 *   NEXT_PUBLIC_META_PIXEL_ID — Facebook Pixel ID (already set)
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import { createHash } from "node:crypto"

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
const API_VERSION = "v21.0"
const GRAPH_API_URL = `https://graph.facebook.com/${API_VERSION}`

// ── Types ──────────────────────────────────────────────────────────────────

export type MetaEventName =
  | "ViewContent"
  | "Lead"
  | "InitiateCheckout"
  | "Schedule"
  | "Contact"
  | "Search"
  | "CompleteRegistration"
  | "Purchase"

interface UserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  /** Client IP address — pass from request headers */
  clientIpAddress?: string
  /** Client user agent — pass from request headers */
  clientUserAgent?: string
  /** Facebook click ID (_fbc cookie) */
  fbc?: string
  /** Facebook browser ID (_fbp cookie) */
  fbp?: string
}

interface CustomData {
  value?: number
  currency?: string
  contentName?: string
  contentCategory?: string
  contentIds?: string[]
  contentType?: string
  numItems?: number
  searchString?: string
  [key: string]: unknown
}

export interface MetaEvent {
  eventName: MetaEventName
  eventTime?: number
  eventSourceUrl?: string
  actionSource?: "website" | "email" | "phone_call" | "chat" | "other"
  userData?: UserData
  customData?: CustomData
}

// ── Hashing (PII must be SHA-256 hashed) ──────────────────────────────────

function hashValue(value: string | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  return createHash("sha256").update(normalized).digest("hex")
}

function hashUserData(user: UserData) {
  return {
    em: user.email ? [hashValue(user.email)] : undefined,
    ph: user.phone ? [hashValue(user.phone.replace(/\D/g, ""))] : undefined,
    fn: hashValue(user.firstName),
    ln: hashValue(user.lastName),
    ct: hashValue(user.city),
    st: hashValue(user.state),
    zp: hashValue(user.postalCode?.replace(/\s/g, "")),
    country: hashValue(user.country || "ca"),
    client_ip_address: user.clientIpAddress,
    client_user_agent: user.clientUserAgent,
    fbc: user.fbc,
    fbp: user.fbp,
  }
}

// ── Send Event ─────────────────────────────────────────────────────────────

export async function sendMetaEvent(event: MetaEvent): Promise<{ success: boolean; eventsReceived?: number; error?: string }> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    // Silently skip if CAPI is not configured — allows graceful degradation
    if (process.env.NODE_ENV === "development") {
      console.info("[Meta CAPI] Skipped — missing PIXEL_ID or ACCESS_TOKEN")
    }
    return { success: false, error: "Meta CAPI not configured" }
  }

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime || Math.floor(Date.now() / 1000),
        event_source_url: event.eventSourceUrl,
        action_source: event.actionSource || "website",
        user_data: event.userData ? hashUserData(event.userData) : undefined,
        custom_data: event.customData,
      },
    ],
  }

  try {
    const url = `${GRAPH_API_URL}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("[Meta CAPI] Error:", data.error?.message || JSON.stringify(data))
      return { success: false, error: data.error?.message || "API error" }
    }

    return { success: true, eventsReceived: data.events_received }
  } catch (err) {
    console.error("[Meta CAPI] Network error:", err)
    return { success: false, error: "Network error" }
  }
}
