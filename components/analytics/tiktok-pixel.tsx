"use client"

/**
 * TikTok Pixel — gated on marketing consent + env var.
 *
 * Renders nothing when:
 *   - NEXT_PUBLIC_TIKTOK_PIXEL_ID is unset (env-stub mode)
 *   - The user has not granted marketing consent (cookie banner)
 *
 * When both gates pass, loads the official TikTok Pixel script and
 * fires a PageView event. Subsequent pageview tracking is delegated
 * to GTM via the `dataLayer` (TikTok provides a built-in GTM template).
 *
 * Spec: https://business-api.tiktok.com/portal/docs?id=1739585702826497
 */

import Script from "next/script"
import { useCookieConsent } from "@/lib/hooks/use-cookie-consent"

const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID

declare global {
  interface Window {
    /** TikTok Pixel global. Created by the loader script. */
    ttq?: {
      load: (pixelId: string) => void
      page: () => void
      track: (event: string, props?: Record<string, unknown>) => void
    }
  }
}

export function TikTokPixel() {
  const { hasMarketingConsent } = useCookieConsent()
  if (!TIKTOK_PIXEL_ID) return null
  if (!hasMarketingConsent) return null

  return (
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;
          var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
          ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
          ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
          var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
          var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${TIKTOK_PIXEL_ID}');
          ttq.page();
        }(globalThis, document, 'ttq');
      `}
    </Script>
  )
}

/** Fire a TikTok Pixel event (no-op if pixel not loaded). */
export function trackTikTokEvent(event: string, props?: Record<string, unknown>): void {
  if (globalThis.window === undefined) return
  if (!globalThis.window.ttq) return
  globalThis.window.ttq.track(event, props)
}
