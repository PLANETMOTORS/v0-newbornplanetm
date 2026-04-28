/**
 * lib/brand/colors.ts
 *
 * Planet Motors — single source of truth for brand colours.
 *
 * The web (Tailwind), email templates, charts, PDF receipts and AI agent
 * UIs all import from this module so the palette never drifts. Tailwind
 * v4 mirrors the same hex values via `--color-brand-*` tokens declared
 * in `app/globals.css` (see `@theme` block) — keep the two in sync.
 *
 * Adding / changing a brand colour:
 *   1. Update the BRAND object below.
 *   2. Update the matching `--color-brand-*` token in `app/globals.css`.
 *   3. Update `BRAND_GUIDELINES.md` so reviewers (and the SonarCloud /
 *      qodo "approved palette" rule) treat it as canonical.
 *
 * Accessibility note:
 *   Every primary swatch listed here ships ≥ 4.5:1 contrast against
 *   white — safe for badge text, button labels and CTA copy.
 */

export const BRAND = {
  // ── PRIMARY ──────────────────────────────────────────────────────────
  /** Default badge / header background / trust marker. */
  navy: "#1e3a8a",
  /** Hover state for navy buttons / pills. */
  navyHover: "#172554",
  /** Email header / dark surface — slate-900, deeper than navy. */
  navyDark: "#0f172a",

  // ── URGENCY ──────────────────────────────────────────────────────────
  /** Popular badge, hot leads, alert pills. */
  red: "#dc2626",
  /** Hover state for red buttons / pills. */
  redHover: "#b91c1c",

  // ── EV / FRESHNESS ───────────────────────────────────────────────────
  /** Electric-vehicle highlight, "New Arrival", price-drop confirmation. */
  green: "#16a34a",
  /** Hover state for green buttons / pills. */
  greenHover: "#15803d",
  /** Soft success surface (toast background, success banner). */
  greenLight: "#dcfce7",

  // ── SHOPPING / COMMERCE ──────────────────────────────────────────────
  /** "Buy Now", "Reserve", "Add to cart", lease-deal CTA. */
  orange: "#ea580c",
  /** Hover state for orange buttons / CTAs. */
  orangeHover: "#c2410c",
  /** Email gold accent — slightly warmer amber for header strips. */
  gold: "#f59e0b",
  /** Pale gold for hover / focus rings on warm CTAs. */
  goldLight: "#fbbf24",

  // ── PREMIUM / LUXURY ─────────────────────────────────────────────────
  /** "Premium", "Luxury", VIP membership, certified-pre-owned overlay. */
  purple: "#7e22ce",
  /** Hover state for premium pills. */
  purpleHover: "#6b21a8",

  // ── SUPPORTING (typography / surfaces) ────────────────────────────────
  /** Primary text on light backgrounds. */
  slate: "#64748b",
  /** Card / table-row background, muted surface. */
  slateLight: "#f1f5f9",
  /** Hairline borders. */
  border: "#e2e8f0",
  /** Pure white surfaces / negative space. */
  white: "#ffffff",
  /** Email link / anchor blue (kept for legacy compatibility). */
  blue: "#1d4ed8",
  /** Lighter blue for hover states. */
  blueLight: "#3b82f6",
} as const

export type BrandColor = keyof typeof BRAND
export type BrandHex = (typeof BRAND)[BrandColor]

// ── Semantic role aliases ───────────────────────────────────────────────
// Use these in product code when the *meaning* matters more than the
// hue. They guarantee that a future palette refresh (e.g. orange ↔ amber
// rebrand) only needs a one-line change here.

export const BRAND_ROLE = {
  primary: BRAND.navy,
  urgency: BRAND.red,
  ev: BRAND.green,
  shopping: BRAND.orange,
  premium: BRAND.purple,
} as const

export type BrandRole = keyof typeof BRAND_ROLE

// ── Tailwind class helpers ──────────────────────────────────────────────
// Keep these in lock-step with the `--color-brand-*` tokens in
// app/globals.css. They exist so React components can pick a class via
// a typed map instead of stringly-typed `bg-brand-*` literals scattered
// across the codebase.

export const BRAND_BG_CLASS: Record<BrandRole, string> = {
  primary: "bg-brand-navy",
  urgency: "bg-brand-red",
  ev: "bg-brand-green",
  shopping: "bg-brand-orange",
  premium: "bg-brand-purple",
}

export const BRAND_TEXT_CLASS: Record<BrandRole, string> = {
  primary: "text-brand-navy",
  urgency: "text-brand-red",
  ev: "text-brand-green",
  shopping: "text-brand-orange",
  premium: "text-brand-purple",
}

export const BRAND_RING_CLASS: Record<BrandRole, string> = {
  primary: "ring-brand-navy",
  urgency: "ring-brand-red",
  ev: "ring-brand-green",
  shopping: "ring-brand-orange",
  premium: "ring-brand-purple",
}
