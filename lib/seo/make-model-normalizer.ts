/**
 * lib/seo/make-model-normalizer.ts
 *
 * Normalizes make/model strings so values stored in Supabase (which come
 * from HomeNet, Drivee, and manual admin entries with inconsistent
 * punctuation) match the URL slugs we use for category landing pages.
 *
 * Real-world variations we have to handle without breaking matching:
 *   "Toyota"          ↔ "toyota"
 *   "RAV4" / "RAV-4"  ↔ "rav4"
 *   "CR-V" / "CRV"    ↔ "cr-v"
 *   "F-150" / "F150"  ↔ "f-150"
 *   "Mustang Mach-E"  ↔ "mustang-mach-e"
 *   "Mercedes-Benz"   ↔ "mercedes-benz"
 *
 * We solve this with two functions:
 *  - `canonicalize` — collapses any string to a comparable token by
 *    lowercasing and stripping all non-alphanumerics. Used internally
 *    by `matchesSlug` so equality is robust to formatting.
 *  - `toUrlSlug` — produces the canonical hyphenated slug form we
 *    show in URLs ("Mercedes-Benz" → "mercedes-benz").
 *
 * Plus a small `MAKE_ALIASES` / `MODEL_ALIASES` dictionary for known
 * variants that share semantic identity but not spelling.
 */

/** Maps alternate make spellings to a canonical lowercase form. */
const MAKE_ALIASES: Record<string, string> = {
  'mercedes': 'mercedes-benz',
  'mercedesbenz': 'mercedes-benz',
  'mb': 'mercedes-benz',
  'vw': 'volkswagen',
  'chevy': 'chevrolet',
  'rangerover': 'land-rover',
  'landrover': 'land-rover',
  'rolls': 'rolls-royce',
  'aston': 'aston-martin',
  'alfa': 'alfa-romeo',
}

/** Maps alternate model spellings to a canonical hyphenated form. */
const MODEL_ALIASES: Record<string, string> = {
  'rav-4': 'rav4',
  'rav 4': 'rav4',
  'crv': 'cr-v',
  'cr v': 'cr-v',
  'hrv': 'hr-v',
  'hr v': 'hr-v',
  'f150': 'f-150',
  'f 150': 'f-150',
  'f250': 'f-250',
  'f350': 'f-350',
  'mustangmache': 'mustang-mach-e',
  'mustang mach e': 'mustang-mach-e',
  'mustang mach-e': 'mustang-mach-e',
  'modely': 'model-y',
  'model y': 'model-y',
  'model3': 'model-3',
  'model 3': 'model-3',
  'modelx': 'model-x',
  'model x': 'model-x',
  'models': 'model-s',
  'model s': 'model-s',
  'ioniq5': 'ioniq-5',
  'ioniq 5': 'ioniq-5',
  'ioniq6': 'ioniq-6',
  'ioniq 6': 'ioniq-6',
  'etron': 'e-tron',
  'e tron': 'e-tron',
  'i4': 'i4',
  'ix': 'ix',
  'eqs': 'eqs',
  'eqe': 'eqe',
  'r1s': 'r1s',
  'r1t': 'r1t',
  'gv60': 'gv60',
  'gv70': 'gv70',
  'gv80': 'gv80',
}

/**
 * Reduce a string to a comparable token: lowercase + alphanumeric only.
 *
 *   canonicalize("RAV-4")    === "rav4"
 *   canonicalize("CR-V")     === "crv"
 *   canonicalize("Model 3")  === "model3"
 *   canonicalize("F-150")    === "f150"
 *
 * Any two strings that should be considered "the same model" map to
 * the same canonical form.
 */
export function canonicalize(value: string | null | undefined): string {
  if (!value) return ''
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Convert a make/model string to its URL slug form (lowercase, hyphenated).
 *
 *   toUrlSlug("Mercedes-Benz")   === "mercedes-benz"
 *   toUrlSlug("Mustang Mach-E")  === "mustang-mach-e"
 *   toUrlSlug("RAV4")            === "rav4"
 *
 * Whitespace, punctuation runs, and trailing/leading hyphens collapse.
 */
export function toUrlSlug(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_/\\&]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Resolve any make spelling to its canonical lowercase form, applying
 * known aliases. Used by the category slug parser to group "mercedes",
 * "mercedes-benz", and "mb" under one bucket.
 */
export function normalizeMake(input: string | null | undefined): string {
  const slug = toUrlSlug(input)
  if (!slug) return ''
  const canon = canonicalize(slug)
  if (MAKE_ALIASES[canon]) return MAKE_ALIASES[canon]
  if (MAKE_ALIASES[slug]) return MAKE_ALIASES[slug]
  return slug
}

/**
 * Resolve any model spelling to its canonical hyphenated form.
 *
 *   normalizeModel("RAV-4")        === "rav4"
 *   normalizeModel("CR-V")         === "cr-v"
 *   normalizeModel("CRV")          === "cr-v"
 *   normalizeModel("Mustang Mach-E") === "mustang-mach-e"
 */
export function normalizeModel(input: string | null | undefined): string {
  const slug = toUrlSlug(input)
  if (!slug) return ''
  const canon = canonicalize(slug)
  if (MODEL_ALIASES[canon]) return MODEL_ALIASES[canon]
  if (MODEL_ALIASES[slug]) return MODEL_ALIASES[slug]
  return slug
}

/**
 * Test whether a HomeNet/admin-stored make value should match a URL
 * slug. Used by category page filters to query Supabase for vehicles
 * whose `make` column matches the URL even when punctuation differs.
 *
 *   matchesMake("Mercedes-Benz", "mercedes-benz") === true
 *   matchesMake("Mercedes",      "mercedes-benz") === true   (alias)
 *   matchesMake("BMW",           "bmw")           === true
 *   matchesMake("BMW",           "tesla")         === false
 */
export function matchesMake(stored: string | null | undefined, slug: string): boolean {
  return normalizeMake(stored) === normalizeMake(slug)
}

/**
 * Test whether a HomeNet/admin-stored model value should match a URL slug.
 *
 *   matchesModel("RAV4",   "rav4")    === true
 *   matchesModel("RAV-4",  "rav4")    === true   (canonical form)
 *   matchesModel("CR-V",   "cr-v")    === true
 *   matchesModel("CRV",    "cr-v")    === true   (alias)
 *   matchesModel("F150",   "f-150")   === true   (alias)
 *   matchesModel("Camry",  "rav4")    === false
 */
export function matchesModel(stored: string | null | undefined, slug: string): boolean {
  return canonicalize(normalizeModel(stored)) === canonicalize(normalizeModel(slug))
}

/**
 * Build a list of acceptable variant strings for a given URL slug, so
 * a Supabase `.in()` query can match all stored spellings.
 *
 *   modelVariantsForSlug("cr-v") === ["cr-v", "crv", "cr v", "CR-V", "CRV"]
 *
 * Returns variants in mixed case because Supabase string equality is
 * case-sensitive but the `.ilike()` operator is. Callers typically use
 * `.ilike.any()` or fold this with `canonicalize` server-side.
 */
export function modelVariantsForSlug(slug: string): string[] {
  const normalized = normalizeModel(slug)
  const canon = canonicalize(normalized)
  const variants = new Set<string>()
  variants.add(normalized)
  variants.add(canon)
  variants.add(normalized.toUpperCase())
  variants.add(normalized.replace(/-/g, ''))
  variants.add(normalized.replace(/-/g, ' '))
  // Reverse-look the alias dictionary so HomeNet's spelling is included
  for (const [alias, canonical] of Object.entries(MODEL_ALIASES)) {
    if (canonical === normalized) variants.add(alias)
  }
  return Array.from(variants).filter(Boolean)
}
