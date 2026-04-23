const DEFAULT_SITE_URL = 'https://www.planetmotors.ca'

function normalizeSiteUrl(value: string | undefined): string {
  if (!value) {
    return DEFAULT_SITE_URL
  }

  try {
    const normalized = new URL(value)
    return normalized.origin
  } catch {
    return DEFAULT_SITE_URL
  }
}

export function getPublicSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL)
}
