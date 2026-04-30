"use client"

/**
 * Snapchat Pixel — gated on marketing consent + env var.
 *
 * Renders nothing when:
 *   - NEXT_PUBLIC_SNAPCHAT_PIXEL_ID is unset (env-stub mode)
 *   - The user has not granted marketing consent
 *
 * When both gates pass, loads Snap's pixel SDK and fires PAGE_VIEW.
 * Subsequent events use `trackSnapEvent()` (e.g. ADD_CART, PURCHASE,
 * VIEW_CONTENT — see Snapchat's standard event taxonomy).
 *
 * NOTE: We deliberately do NOT pass `user_email` in the init call.
 * Snap's docs offer that for hashed-email matching but doing so on
 * every pageview would leak the email of every signed-in admin into
 * the pixel. Instead, we attach hashed PII per-event via
 * `trackSnapEvent` from the relevant funnel handlers (lead form,
 * checkout, etc.) where the legal basis is clearer.
 *
 * Spec: https://businesshelp.snapchat.com/s/article/pixel-website-install
 */

import Script from "next/script"
import { useCookieConsent } from "@/lib/hooks/use-cookie-consent"

const SNAPCHAT_PIXEL_ID = process.env.NEXT_PUBLIC_SNAPCHAT_PIXEL_ID

declare global {
  interface Window {
    /** Snap Pixel global. Created by the loader script. */
    snaptr?: (...args: unknown[]) => void
  }
}

export function SnapchatPixel() {
  const { hasMarketingConsent } = useCookieConsent()
  if (!SNAPCHAT_PIXEL_ID) return null
  if (!hasMarketingConsent) return null

  return (
    <Script id="snapchat-pixel" strategy="afterInteractive">
      {`
        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){
          a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
          a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
          r.src=n;var u=t.getElementsByTagName(s)[0];
          u.parentNode.insertBefore(r,u);})(globalThis,document,
          'https://sc-static.net/scevent.min.js');
        snaptr('init', '${SNAPCHAT_PIXEL_ID}');
        snaptr('track', 'PAGE_VIEW');
      `}
    </Script>
  )
}

/**
 * Fire a Snapchat Pixel event (no-op if pixel not loaded).
 *
 * Standard event names per Snap's taxonomy:
 *   PAGE_VIEW, VIEW_CONTENT, ADD_CART, START_CHECKOUT, ADD_BILLING,
 *   PURCHASE, SAVE, SIGN_UP, SUBSCRIBE, COMPLETE_TUTORIAL, INVITE,
 *   LOGIN, SHARE, RESERVE, ACHIEVEMENT_UNLOCKED, ADD_TO_WISHLIST,
 *   SPENT_CREDITS, RATE, START_TRIAL, SEARCH, LIST_VIEW.
 *
 * Custom params (Snap-specific):
 *   price, currency, item_ids, item_category, number_items,
 *   transaction_id, user_email, user_phone_number,
 *   user_hashed_email, user_hashed_phone_number, uuid_c1.
 */
export function trackSnapEvent(
  event: string,
  props?: Record<string, unknown>,
): void {
  if (globalThis.window === undefined) return
  if (!globalThis.window.snaptr) return
  globalThis.window.snaptr("track", event, props ?? {})
}
