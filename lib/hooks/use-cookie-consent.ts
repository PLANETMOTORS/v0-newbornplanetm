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
  if (typeof window === "undefined") return DEFAULT_STATE
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
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_STATE)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setConsent(readStoredConsent())
    setMounted(true)
  }, [])

  const acceptAll = useCallback(() => {
    const next: ConsentState = {
      decided: true,
      updatedAt: new Date().toISOString(),
      categories: { essential: true, analytics: true, marketing: true },
    }
    writeStoredConsent(next)
    setConsent(next)
  }, [])

  const rejectAll = useCallback(() => {
    const next: ConsentState = {
      decided: true,
      updatedAt: new Date().toISOString(),
      categories: { essential: true, analytics: false, marketing: false },
    }
    writeStoredConsent(next)
    setConsent(next)
  }, [])

  const savePreferences = useCallback((categories: Omit<ConsentCategories, "essential">) => {
    const next: ConsentState = {
      decided: true,
      updatedAt: new Date().toISOString(),
      categories: { essential: true, ...categories },
    }
    writeStoredConsent(next)
    setConsent(next)
  }, [])

  const resetConsent = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
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
