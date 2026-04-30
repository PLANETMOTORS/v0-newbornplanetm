"use client"

/**
 * Microsoft Clarity — gated on analytics consent + env var.
 *
 * Clarity is an analytics product (heatmaps + session recordings)
 * that we treat as analytics_storage under Consent Mode, NOT
 * marketing — it does not personalize ads. So we gate on
 * `hasAnalyticsConsent`, NOT marketing.
 *
 * Renders nothing when:
 *   - NEXT_PUBLIC_CLARITY_PROJECT_ID is unset (env-stub mode)
 *   - The user has not granted analytics consent
 *
 * Spec: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
 */

import Script from "next/script"
import { useCookieConsent } from "@/lib/hooks/use-cookie-consent"

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

declare global {
  interface Window {
    /** Clarity global. Created by the loader script. */
    clarity?: (...args: unknown[]) => void
  }
}

export function MicrosoftClarity() {
  const { hasAnalyticsConsent } = useCookieConsent()
  if (!CLARITY_PROJECT_ID) return null
  if (!hasAnalyticsConsent) return null

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
      `}
    </Script>
  )
}

/** Tag a session in Clarity (no-op if Clarity not loaded). */
export function tagClaritySession(key: string, value: string): void {
  if (typeof window === "undefined") return
  if (!window.clarity) return
  window.clarity("set", key, value)
}

/** Identify a Clarity session (no-op if Clarity not loaded). */
export function identifyClaritySession(userId: string): void {
  if (typeof window === "undefined") return
  if (!window.clarity) return
  window.clarity("identify", userId)
}
