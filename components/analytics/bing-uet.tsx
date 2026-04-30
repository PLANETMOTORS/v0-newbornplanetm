"use client"

/**
 * Bing UET (Universal Event Tracking) — gated on marketing consent + env var.
 *
 * UET is the conversion-tracking pixel for Microsoft Advertising
 * (Bing Ads). It belongs under marketing/ad_storage consent because
 * it powers ad personalization and remarketing.
 *
 * Renders nothing when:
 *   - NEXT_PUBLIC_BING_UET_ID is unset (env-stub mode)
 *   - The user has not granted marketing consent
 *
 * Spec: https://help.ads.microsoft.com/#apex/3/en/56684/2
 */

import Script from "next/script"
import { useCookieConsent } from "@/lib/hooks/use-cookie-consent"

const BING_UET_ID = process.env.NEXT_PUBLIC_BING_UET_ID

declare global {
  interface Window {
    /** Bing UET global queue. Created by the loader script. */
    uetq?: Array<unknown>
  }
}

export function BingUET() {
  const { hasMarketingConsent } = useCookieConsent()
  if (!BING_UET_ID) return null
  if (!hasMarketingConsent) return null

  return (
    <Script id="bing-uet" strategy="afterInteractive">
      {`
        (function(w,d,t,r,u){
          var f,n,i;
          w[u]=w[u]||[],f=function(){
            // NOTE: enableAutoSpaTracking is intentionally OMITTED.
            // SPA route changes are fired manually from
            // usePixelRouteTracking() so all four pixels (Meta, Snap,
            // TikTok, Bing) share one source of truth — preventing
            // double-fires that Microsoft's auto-tracker is known to
            // produce on Next.js App Router.
            var o={ti:"${BING_UET_ID}"};
            o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")
          },
          n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){
            var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)
          },
          i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i);
        })(window,document,"script","//bat.bing.com/bat.js","uetq");
      `}
    </Script>
  )
}

/** Fire a Bing UET event (no-op if UET not loaded). */
export function trackBingEvent(event: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return
  if (!window.uetq) return
  window.uetq.push("event", event, props ?? {})
}
