/**
 * SEO-friendly vehicle slug generator.
 *
 * Produces slugs in the format: "2024-toyota-camry-le-fwd-stk12345"
 *
 * ─── URL Migration Strategy (DO NOT implement yet) ──────────────────────────
 *
 * Current URL structure:  /vehicles/[id]
 * Target URL structure:   /inventory/used/[make]/[model]/[slug]
 *
 * Migration plan:
 *   1. Add a `slug` column to the `vehicles` table (VARCHAR(200), UNIQUE, indexed).
 *      Migration SQL:
 *        ALTER TABLE vehicles ADD COLUMN slug VARCHAR(200);
 *        CREATE UNIQUE INDEX idx_vehicles_slug ON vehicles(slug);
 *      Then backfill existing rows:
 *        UPDATE vehicles SET slug = generateVehicleSlug(...)  -- via script
 *
 *   2. Generate slugs on vehicle creation/import (HomoNet pipeline or Sanity hook).
 *
 *   3. Create new route: app/inventory/used/[make]/[model]/[slug]/page.tsx
 *      - This route resolves the vehicle by slug.
 *      - The old /vehicles/[id] route should 301-redirect to the new canonical URL.
 *
 *   4. Update sitemap, internal links, and canonical tags to use the new URL.
 *
 *   5. Submit updated sitemap to Google Search Console and monitor indexing.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface VehicleSlugInput {
  year: number
  make: string
  model: string
  trim?: string | null
  drivetrain?: string | null
  stockNumber: string
}

/**
 * Generate an SEO-friendly slug for a vehicle listing.
 *
 * @example
 * generateVehicleSlug({ year: 2024, make: "Toyota", model: "Camry", trim: "LE", drivetrain: "FWD", stockNumber: "PM24-1234" })
 * // → "2024-toyota-camry-le-fwd-stkpm24-1234"
 */
export function generateVehicleSlug(vehicle: VehicleSlugInput): string {
  const parts: string[] = [
    String(vehicle.year),
    vehicle.make,
    vehicle.model,
  ]

  if (vehicle.trim) {
    parts.push(vehicle.trim)
  }

  if (vehicle.drivetrain) {
    parts.push(vehicle.drivetrain)
  }

  // Append stock number for uniqueness (prefixed with "stk")
  parts.push(`stk${vehicle.stockNumber}`)

  return parts
    .join("-")
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, "-") // replace non-alphanumeric chars with hyphens
    .replaceAll(/-{2,}/g, "-")       // collapse consecutive hyphens
    .replaceAll(/^-|-$/g, "")        // trim leading/trailing hyphens
}
