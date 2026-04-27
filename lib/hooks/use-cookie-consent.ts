"use client"

import { useState, useEffect, useCallback } from "react"

export type ConsentCategories = {
  essential: true // Always true, cannot be disabled
  analytics: boolean
  marketing: boolean
}

export type ConsentState = {
  /** Whether the user has made a consent decision */
  decided: boolean
  /** Timestamp of when consent was given/updated */
  updatedAt: string | null
  /** Per-category consent */
  categories: ConsentCategories
}

const STORAGE_KEY = "pm_cookie_consent"

const DEFAULT_STATE: ConsentState = {
  decided: false,
  updatedAt: null,
  categories: {
    essential: true,
    analytics: false,
    marketing: false,
  },
}

function readStoredConsent(): ConsentState {
  if (globalThis.window === undefined) return DEFAULT_STATE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as ConsentState
    // Ensure essential is always true
    parsed.categories.essential = true
    return parsed
  } catch {
    return DEFAULT_STATE
  }
}

function writeStoredConsent(state: ConsentState) {
  if (globalThis.window === undefined) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** Push a Google Consent Mode v2 update so gtag respects the user's choice. */
function updateGoogleConsent(categories: ConsentCategories) {
  if (globalThis.window === undefined || typeof globalThis.window.gtag !== "function") return
  globalThis.window.gtag("consent", "update", {    analytics_storage: categories.analytics ? "granted" : "denied",
    ad_storage: categories.marketing ? "granted" : "denied",
    ad_user_data: categories.marketing ? "granted" : "denied",
    ad_personalization: categories.marketing ? "granted" : "denied",
  })
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_STATE)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = readStoredConsent()
    setConsent(stored)
    setMounted(true)
    // Restore consent state for returning users who already accepted
    if (stored.decided) {
      updateGoogleConsent(stored.categories)
    }
  }, [])

  const acceptAll = useCallback(() => {
    const next: ConsentState = {
      decided: true,
      updatedAt: new Date().toISOString(),
      categories: { essential: true, analytics: true, marketing: true },
    }
    writeStoredConsent(next)
    setConsent(next)
    updateGoogleConsent(next.categories)
  }, [])

  const rejectAll = useCallback(() => {
    const next: ConsentState = {
      decided: true,
      updatedAt: new Date().toISOString(),
      categories: { essential: true, analytics: false, marketing: false },
    }
    writeStoredConsent(next)
    setConsent(next)
    updateGoogleConsent(next.categories)
  }, [])

  const savePreferences = useCallback((categories: Omit<ConsentCategories, "essential">) => {
    const next: ConsentState = {
      decided: true,
      updatedAt: new Date().toISOString(),
      categories: { essential: true, ...categories },
    }
    writeStoredConsent(next)
    setConsent(next)
    updateGoogleConsent(next.categories)
  }, [])

  const resetConsent = useCallback(() => {
    if (globalThis.window !== undefined) {      localStorage.removeItem(STORAGE_KEY)
    }
    setConsent(DEFAULT_STATE)
  }, [])

  return {
    consent,
    mounted,
    showBanner: mounted && !consent.decided,
    acceptAll,
    rejectAll,
    savePreferences,
    resetConsent,
    hasAnalyticsConsent: consent.decided && consent.categories.analytics,
    hasMarketingConsent: consent.decided && consent.categories.marketing,
  }
}
