import type { AttributionPayload } from './types'

const STORAGE_KEY = 'pm_attribution_v2'
const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid'] as const
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

type StoredAttribution = {
  first_touch?: AttributionPayload
  last_touch?: AttributionPayload
}

const ORGANIC_HOST_PATTERNS = [
  /(^|\.)google\./,
  /(^|\.)bing\./,
  /(^|\.)yahoo\./,
  /(^|\.)duckduckgo\./,
  /(^|\.)ecosia\./,
  /(^|\.)yandex\./,
]

const SOCIAL_HOST_PATTERNS = [
  /(^|\.)facebook\./,
  /(^|\.)instagram\./,
  /(^|\.)threads\./,
  /(^|\.)tiktok\./,
  /(^|\.)x\./,
  /(^|\.)twitter\./,
  /(^|\.)linkedin\./,
  /(^|\.)youtube\./,
  /(^|\.)reddit\./,
]

function getStorage(storage: 'localStorage' | 'sessionStorage'): Storage | null {
  if (globalThis.window === undefined) return null
  try {
    return globalThis.window[storage]
  } catch {
    return null
  }
}

function readParam(params: URLSearchParams, key: string): string | null {
  const value = params.get(key)
  return value && value.trim().length > 0 ? value.trim() : null
}

function hostnameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function isInternalReferrer(referrer: string | null, currentHost: string): boolean {
  const referrerHost = hostnameFromUrl(referrer)
  if (!referrerHost) return false
  const cleanCurrentHost = currentHost.replace(/^www\./, '').toLowerCase()
  return referrerHost === cleanCurrentHost || referrerHost.endsWith(`.${cleanCurrentHost}`)
}

function inferSourceMedium(
  referrer: string | null,
  currentHost: string,
): Pick<AttributionPayload, 'utm_source' | 'utm_medium'> {
  const referrerHost = hostnameFromUrl(referrer)

  if (!referrerHost || isInternalReferrer(referrer, currentHost)) {
    return { utm_source: 'direct', utm_medium: 'none' }
  }

  if (ORGANIC_HOST_PATTERNS.some((pattern) => pattern.test(referrerHost))) {
    return { utm_source: referrerHost, utm_medium: 'organic' }
  }

  if (SOCIAL_HOST_PATTERNS.some((pattern) => pattern.test(referrerHost))) {
    return { utm_source: referrerHost, utm_medium: 'social' }
  }

  return { utm_source: referrerHost, utm_medium: 'referral' }
}

function hasCampaignOrClickId(payload: AttributionPayload): boolean {
  return [...UTM_KEYS, ...CLICK_ID_KEYS].some((key) => Boolean(payload[key]))
}

export function buildAttributionFromLocation(
  options: { includeDirect?: boolean } = {},
): AttributionPayload | null {
  if (globalThis.window === undefined) return null

  const params = new URLSearchParams(globalThis.window.location.search)
  const currentHost = globalThis.window.location.hostname
  const referrer = globalThis.document?.referrer || null

  const payload: AttributionPayload = {
    landing_page: globalThis.window.location.href,
    landing_page_path: `${globalThis.window.location.pathname}${globalThis.window.location.search}`,
    referrer,
    captured_at: new Date().toISOString(),
  }

  for (const key of UTM_KEYS) {
    payload[key] = readParam(params, key)
  }

  for (const key of CLICK_ID_KEYS) {
    payload[key] = readParam(params, key)
  }

  const inferred = inferSourceMedium(referrer, currentHost)
  payload.utm_source = payload.utm_source ?? inferred.utm_source
  payload.utm_medium = payload.utm_medium ?? inferred.utm_medium

  const campaignOrClick = hasCampaignOrClickId(payload)
  const externalReferrer = Boolean(referrer && !isInternalReferrer(referrer, currentHost))
  const directAllowed = options.includeDirect === true && inferred.utm_source === 'direct'

  if (!campaignOrClick && !externalReferrer && !directAllowed) {
    return null
  }

  return payload
}

export function captureAttributionFromUrl(
  options: { persist?: boolean; storage?: 'localStorage' | 'sessionStorage' } = {},
): AttributionPayload | StoredAttribution | null {
  const existing = readStoredAttribution(options.storage)
  const attribution = buildAttributionFromLocation({ includeDirect: !existing })

  if (!attribution) return existing

  if (existing && !hasCampaignOrClickId(attribution)) {
    return existing
  }

  if (options.persist !== false) {
    persistAttribution(attribution, options.storage)
  }

  return attribution
}

export function persistAttribution(
  attribution: AttributionPayload,
  storage: 'localStorage' | 'sessionStorage' = 'sessionStorage',
): void {
  const target = getStorage(storage)
  if (!target) return

  try {
    const existing = readStoredAttribution(storage)
    const merged: StoredAttribution = {
      first_touch: existing?.first_touch ?? attribution,
      last_touch: attribution,
    }
    target.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // Storage can fail in privacy modes. Tracking should never break the UI.
  }
}

export function readStoredAttribution(
  storage: 'localStorage' | 'sessionStorage' = 'sessionStorage',
): StoredAttribution | null {
  const target = getStorage(storage)
  if (!target) return null

  try {
    const value = target.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export function getAttributionForEvent(): Record<string, unknown> {
  const stored = readStoredAttribution('sessionStorage') ?? readStoredAttribution('localStorage')
  if (!stored) return {}

  const lastTouch = stored.last_touch ?? stored.first_touch
  const firstTouch = stored.first_touch ?? stored.last_touch
  if (!lastTouch) return {}

  return {
    utm_source: lastTouch.utm_source ?? null,
    utm_medium: lastTouch.utm_medium ?? null,
    utm_campaign: lastTouch.utm_campaign ?? null,
    utm_content: lastTouch.utm_content ?? null,
    utm_term: lastTouch.utm_term ?? null,
    gclid: lastTouch.gclid ?? null,
    gbraid: lastTouch.gbraid ?? null,
    wbraid: lastTouch.wbraid ?? null,
    fbclid: lastTouch.fbclid ?? null,
    ttclid: lastTouch.ttclid ?? null,
    msclkid: lastTouch.msclkid ?? null,
    first_touch: firstTouch ?? null,
    last_touch: lastTouch ?? null,
    landing_page: firstTouch?.landing_page ?? lastTouch.landing_page ?? null,
    landing_page_path: firstTouch?.landing_page_path ?? lastTouch.landing_page_path ?? null,
    referrer: firstTouch?.referrer ?? lastTouch.referrer ?? null,
  }
}
