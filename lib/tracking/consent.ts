import { pushEvent } from './data-layer'

const CONSENT_STORAGE_KEY = 'pm_consent_v1'

export type ConsentCategoryState = {
  analytics: boolean
  marketing: boolean
  functionality?: boolean
  personalization?: boolean
  security?: boolean
}

export type GoogleConsentModeState = {
  analytics_storage: 'granted' | 'denied'
  ad_storage: 'granted' | 'denied'
  ad_user_data: 'granted' | 'denied'
  ad_personalization: 'granted' | 'denied'
  functionality_storage: 'granted' | 'denied'
  personalization_storage: 'granted' | 'denied'
  security_storage: 'granted' | 'denied'
}

function grant(value: boolean | undefined, defaultValue = false): 'granted' | 'denied' {
  return (value ?? defaultValue) ? 'granted' : 'denied'
}

function rememberConsent(consent: GoogleConsentModeState) {
  if (globalThis.window === undefined) return
  try {
    globalThis.window.sessionStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ ...consent, captured_at: new Date().toISOString() }),
    )
  } catch {
    // Privacy modes can block storage. Consent updates should still reach GTM.
  }
}

function readCookie(name: string): string | null {
  if (globalThis.document === undefined) return null
  const prefix = `${name}=`
  const cookies = globalThis.document.cookie.split('; ')
  for (const cookie of cookies) {
    const trimmed = cookie.trimStart()
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length))
    }
  }
  return null
}

const GRANTED_VALUES = new Set(['yes', 'true', '1', 'granted', 'allow', 'allowed'])
const DENIED_VALUES = new Set(['no', 'false', '0', 'denied', 'deny', 'disallow', 'disallowed'])

function extractKeyValue(cookieValue: string, key: string): string | null {
  const lowerCookie = cookieValue.toLowerCase()
  const lowerKey = key.toLowerCase()
  const keyIndex = lowerCookie.indexOf(lowerKey)
  if (keyIndex === -1) return null

  const afterKey = lowerCookie.slice(keyIndex + lowerKey.length).trimStart()
  if (afterKey.length === 0 || (afterKey[0] !== ':' && afterKey[0] !== '=')) return null

  const valueStr = afterKey.slice(1).trimStart()
  const endIndex = valueStr.search(/[,;&|\s]/)
  return endIndex === -1 ? valueStr : valueStr.slice(0, endIndex)
}

function cookieCategoryGranted(cookieValue: string, keys: readonly string[]): boolean | null {
  for (const key of keys) {
    const value = extractKeyValue(cookieValue, key)
    if (!value) continue
    if (GRANTED_VALUES.has(value)) return true
    if (DENIED_VALUES.has(value)) return false
  }

  return null
}

export function readCookieYesConsent(): (GoogleConsentModeState & { captured_at?: string; source: 'cookieyes' }) | null {
  const value = readCookie('cookieyes-consent')
  if (!value) return null

  const analytics = cookieCategoryGranted(value, ['analytics', 'performance'])
  const marketing = cookieCategoryGranted(value, ['advertisement', 'marketing', 'ads'])

  if (analytics === null && marketing === null) return null

  return {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
    functionality_storage: 'granted',
    personalization_storage: marketing ? 'granted' : 'denied',
    security_storage: 'granted',
    captured_at: new Date().toISOString(),
    source: 'cookieyes',
  }
}

export function readStoredConsent(): (GoogleConsentModeState & { captured_at?: string }) | null {
  if (globalThis.window === undefined) return null

  try {
    const value = globalThis.window.sessionStorage.getItem(CONSENT_STORAGE_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export function getConsentForEvent(): Record<string, unknown> {
  const consent = readStoredConsent() ?? readCookieYesConsent()
  if (!consent) return {}

  return {
    consent_analytics: consent.analytics_storage,
    consent_marketing: consent.ad_storage,
    consent_ad_user_data: consent.ad_user_data,
    consent_ad_personalization: consent.ad_personalization,
    consent_captured_at: consent.captured_at ?? null,
    consent_source: 'source' in consent ? consent.source : 'session',
  }
}

export function toGoogleConsentState(consent: ConsentCategoryState): GoogleConsentModeState {
  return {
    analytics_storage: grant(consent.analytics),
    ad_storage: grant(consent.marketing),
    ad_user_data: grant(consent.marketing),
    ad_personalization: grant(consent.marketing),
    functionality_storage: grant(consent.functionality, true),
    personalization_storage: grant(consent.personalization),
    security_storage: grant(consent.security, true),
  }
}

export function updateGoogleConsent(consent: ConsentCategoryState): GoogleConsentModeState | null {
  if (globalThis.window === undefined) return null

  const googleConsent = toGoogleConsentState(consent)
  rememberConsent(googleConsent)

  if (typeof globalThis.window.gtag === 'function') {
    globalThis.window.gtag('consent', 'update', googleConsent)
  } else {
    globalThis.window.dataLayer = globalThis.window.dataLayer || []
    globalThis.window.dataLayer.push({ event: 'consent_update', ...googleConsent })
  }

  pushEvent({ event: 'consent_update_bridge', ...googleConsent })

  return googleConsent
}
