"use client"

/**
 * Meta (Facebook) Pixel — gated on marketing consent + env var.
 *
 * NOTE: This is the CLIENT-SIDE pixel that fires PageView from the
 * browser. The server-side Conversions API counterpart lives in
 * `lib/meta-capi.ts` and is invoked from server actions / API routes
 * for deduplicated, ad-blocker-resistant event delivery. Both should
 * fire for the same user actions — Meta de-duplicates by event_id.
 *
 * Without the client pixel, Meta's Events Manager shows "0 websites
 * found" and "Last event received Nd ago" because CAPI events don't
 * count toward catalog match rate or pixel website attribution.
 *
 * Renders nothing when:
 *   - NEXT_PUBLIC_META_PIXEL_ID is unset (env-stub mode)
 *   - The user has not granted marketing consent
 *
 * Spec: https://developers.facebook.com/docs/meta-pixel/get-started
 */

import Script from "next/script"
import { useCookieConsent } from "@/lib/hooks/use-cookie-consent"

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

declare global {
  interface Window {
    /** Meta Pixel global. Created by the loader script. */
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void
      queue?: unknown[][]
      loaded?: boolean
      version?: string
      push?: (...args: unknown[]) => void
    }
    _fbq?: Window["fbq"]
  }
}

export function MetaPixel() {
  const { hasMarketingConsent } = useCookieConsent()
  if (!META_PIXEL_ID) return null
  if (!hasMarketingConsent) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){
            if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* 1x1 tracking pixel — must be a raw <img> per Meta's spec.
            next/image cannot be used here because it requires JS to
            bootstrap the optimised loader. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  )
}

/**
 * Fire a Meta Pixel event (no-op if pixel not loaded).
 *
 * Standard events (see https://developers.facebook.com/docs/meta-pixel/reference):
 *   PageView, ViewContent, Search, AddToCart, AddToWishlist,
 *   InitiateCheckout, AddPaymentInfo, Purchase, Lead,
 *   CompleteRegistration, Contact, Schedule, SubmitApplication.
 *
 * Pass `eventID` to deduplicate against the server-side CAPI event
 * fired from `lib/meta-capi.ts` for the same user action. Generate
 * the ID server-side via `generateEventId()` and thread it into both
 * the CAPI call AND this browser pixel call. Without an event ID,
 * Meta's heuristic dedup is unreliable and events double-count.
 *
 * @example
 *   const eventId = generateEventId()              // server
 *   await sendMetaEvent({ eventName: 'Lead', eventId, ... })
 *   // → return eventId to client →
 *   trackMetaEvent('Lead', { value: 1 }, eventId)  // browser
 */
export function trackMetaEvent(
  event: string,
  props?: Record<string, unknown>,
  eventID?: string,
): void {
  if (typeof window === "undefined") return
  if (!window.fbq) return
  if (eventID) {
    window.fbq("track", event, props ?? {}, { eventID })
  } else {
    window.fbq("track", event, props ?? {})
  }
}

/**
 * Fire a custom (non-standard) Meta Pixel event.
 *
 * Pass `eventID` to deduplicate against a server-side CAPI event
 * fired with the same identifier for the same user action.
 */
export function trackMetaCustomEvent(
  event: string,
  props?: Record<string, unknown>,
  eventID?: string,
): void {
  if (typeof window === "undefined") return
  if (!window.fbq) return
  if (eventID) {
    window.fbq("trackCustom", event, props ?? {}, { eventID })
  } else {
    window.fbq("trackCustom", event, props ?? {})
  }
}
