/**
 * lib/seo/indexnow.ts
 *
 * IndexNow API client.
 *
 * IndexNow is a free protocol that lets us notify search engines (Bing,
 * Yandex, Seznam, Naver, DuckDuckGo) instantly when URLs are added,
 * updated, or removed. Without IndexNow, search engines may take 2-4
 * weeks to discover changes via their normal crawl. With IndexNow,
 * changes propagate within minutes.
 *
 * Spec: https://www.indexnow.org/documentation
 *
 * Required env vars (production only):
 *   INDEXNOW_KEY  — 8-128 char hex/alphanumeric key. The same value MUST
 *                   be served at /<INDEXNOW_KEY>.txt at the site root for
 *                   ownership verification (see public/<key>.txt).
 *
 * Contract:
 *   - Non-blocking: returns ok:false on failure but never throws. Callers
 *     can fire-and-forget without worrying about cron jobs failing.
 *   - No-ops gracefully when INDEXNOW_KEY is unset (dev/preview/local).
 *   - Filters out cross-host URLs to satisfy IndexNow's same-host rule.
 *   - Hard 5-second timeout on the API call.
 *
 * Tested in __tests__/lib/seo/indexnow.test.ts.
 */

import { getPublicSiteUrl } from "@/lib/site-url"

/** IndexNow API endpoint. Free, no API key beyond the key file. */
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

/** IndexNow protocol limit: max URLs per single ping. */
const MAX_URLS_PER_REQUEST = 10_000

/** Network timeout — IndexNow normally responds in < 1s. */
const REQUEST_TIMEOUT_MS = 5_000

/** Minimum key length per IndexNow spec (8 chars). */
const MIN_KEY_LENGTH = 8

export interface PingResult {
  /** True when IndexNow accepted the request (HTTP 200/202). */
  ok: boolean
  /** HTTP status code from IndexNow (0 on transport error). */
  status: number
  /** Number of URLs actually sent (after filtering). */
  count: number
  /** Error message when ok is false. */
  error?: string
}

function getKey(): string | undefined {
  const key = process.env.INDEXNOW_KEY
  if (!key || key.length < MIN_KEY_LENGTH) return undefined
  return key
}

/**
 * Returns true when INDEXNOW_KEY is set with a valid-length value.
 *
 * Exported for diagnostics (`/api/health` extension, deploy checks).
 */
export function isIndexNowConfigured(): boolean {
  return getKey() !== undefined
}

/**
 * Build absolute URLs for a list of vehicle IDs, anchored to the public
 * site URL. Use this to convert DB IDs into the URLs you want pinged.
 */
export function buildVehicleUrls(vehicleIds: readonly string[]): string[] {
  const baseUrl = getPublicSiteUrl()
  return vehicleIds.map((id) => `${baseUrl}/vehicles/${id}`)
}

/**
 * Ping IndexNow with one or many URLs.
 *
 * - Non-blocking: returns `{ ok: false }` on failure but never throws.
 *   Cron jobs and webhook handlers can call this without try/catch.
 * - Batches up to 10,000 URLs per request (per IndexNow spec).
 * - No-ops with `{ ok: false, error: "not configured" }` when the key
 *   is missing — safe in dev/preview/local environments.
 *
 * @param urls absolute or root-relative URLs (e.g. "/inventory" or
 *             "https://planetmotors.ca/vehicles/abc"). Cross-host URLs
 *             are filtered out.
 */
export async function pingIndexNow(
  urls: readonly string[],
): Promise<PingResult> {
  const key = getKey()
  if (!key) {
    return {
      ok: false,
      status: 0,
      count: 0,
      error: "INDEXNOW_KEY not configured",
    }
  }

  if (urls.length === 0) {
    return { ok: true, status: 200, count: 0 }
  }

  const siteUrl = getPublicSiteUrl()
  const host = new URL(siteUrl).host

  // Normalise + filter to same-host absolute URLs (IndexNow rejects mismatched hosts).
  const validUrls = normaliseUrls(urls, siteUrl, host).slice(0, MAX_URLS_PER_REQUEST)

  if (validUrls.length === 0) {
    return {
      ok: false,
      status: 0,
      count: 0,
      error: "no valid URLs after host filtering",
    }
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${siteUrl}/${key}.txt`,
        urlList: validUrls,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        count: validUrls.length,
        error: `HTTP ${response.status}`,
      }
    }

    return {
      ok: true,
      status: response.status,
      count: validUrls.length,
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      count: validUrls.length,
      error: err instanceof Error ? err.message : "unknown error",
    }
  }
}

/**
 * Normalise URLs to absolute form on the configured site host.
 * Drops anything we cannot parse or that lives on another domain.
 */
function normaliseUrls(
  urls: readonly string[],
  siteUrl: string,
  host: string,
): string[] {
  const out: string[] = []
  for (const u of urls) {
    const absolute = toAbsoluteUrl(u, siteUrl)
    if (!absolute) continue
    try {
      if (new URL(absolute).host === host) {
        out.push(absolute)
      }
    } catch {
      // Drop unparsable values silently.
    }
  }
  return out
}

function toAbsoluteUrl(value: string, siteUrl: string): string | undefined {
  if (!value) return undefined
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value
  }
  const path = value.startsWith("/") ? value : `/${value}`
  return `${siteUrl}${path}`
}
