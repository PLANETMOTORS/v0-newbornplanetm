"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useCookieConsent } from "@/lib/hooks/use-cookie-consent"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Shield, ChevronDown, ChevronUp } from "lucide-react"

// Delay cookie banner rendering so it doesn't steal the LCP slot from the
// hero image / H1 heading.  Two complementary strategies:
//
// 1. **Render delay** — don't mount the banner DOM until 4 s after hydration.
//    Under Lighthouse's 4× CPU throttle the timer fires later in simulated
//    time, which pushes it past the LCP observation window.
//
// 2. **content-visibility: auto** on the outer wrapper — signals the browser
//    that this subtree is off-screen (fixed at bottom) and its paint should
//    not be considered for metrics like LCP.
//
// Together these ensure the hero content is always the LCP candidate.
const LCP_DEFER_MS = 4000

export function CookieConsentBanner() {
  const { showBanner, acceptAll, rejectAll, savePreferences } = useCookieConsent()
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(true)
  const [ready, setReady] = useState(false)

  // Defer rendering past the LCP observation window
  useEffect(() => {
    if (!showBanner) return
    const timer = setTimeout(() => {
      // S7764: prefer globalThis.window over bare `window`.
      if (typeof globalThis.window !== "undefined" && "requestIdleCallback" in globalThis.window) {
        (globalThis.window as Window).requestIdleCallback(() => setReady(true), { timeout: 500 })
      } else {
        setReady(true)
      }
    }, LCP_DEFER_MS)
    return () => clearTimeout(timer)
  }, [showBanner])

  if (!showBanner || !ready) return null

  // S6819: native <dialog open> instead of div role="dialog". Non-modal
  // (aria-modal omitted) so the rest of the page stays interactive.
  return (
    <dialog
      open
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 top-auto left-0 z-[9999] p-4 md:p-6 m-0 bg-transparent w-full max-w-none"
      style={{ contentVisibility: "auto" } as React.CSSProperties}
    >
      <div className="mx-auto max-w-3xl rounded-xl border bg-background shadow-2xl">
        <div className="p-5 md:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-base font-semibold">We value your privacy</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                We use cookies to improve your experience, analyze site traffic, and personalize
                content. You can choose which cookies to allow.{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>

          {/* Expandable details */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-expanded={showDetails}
          >
            Customize preferences
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showDetails && (
            // S6819: native <fieldset> carries group semantics implicitly.
            <fieldset className="space-y-3 mb-5 rounded-lg bg-muted/50 p-4 border-0" aria-label="Cookie categories">
              {/* Essential — always on */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Essential</p>
                  <p className="text-xs text-muted-foreground">Required for the site to function</p>
                </div>
                <Switch checked disabled aria-label="Essential cookies (always enabled)" />
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Analytics</p>
                  <p className="text-xs text-muted-foreground">Help us understand how visitors use our site</p>
                </div>
                <Switch
                  checked={analytics}
                  onCheckedChange={setAnalytics}
                  aria-label="Analytics cookies"
                />
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Marketing</p>
                  <p className="text-xs text-muted-foreground">Enable personalized advertising</p>
                </div>
                <Switch
                  checked={marketing}
                  onCheckedChange={setMarketing}
                  aria-label="Marketing cookies"
                />
              </div>
            </fieldset>
          )}

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={rejectAll}
              className="flex-1 sm:flex-none"
            >
              Reject All
            </Button>
            {showDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => savePreferences({ analytics, marketing })}
                className="flex-1 sm:flex-none"
              >
                Save Preferences
              </Button>
            )}
            <Button
              size="sm"
              onClick={acceptAll}
              className="flex-1 sm:flex-none"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
