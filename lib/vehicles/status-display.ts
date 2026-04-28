/**
 * lib/vehicles/status-display.ts
 *
 * Shared display tokens for the vehicle-status surface (VDP, structured
 * data, JSON-LD, modal banners). One source of truth for:
 *
 *   - Customer-facing label    ("This vehicle is reserved", ...)
 *   - Tailwind colour classes  (yellow / orange / red)
 *   - Schema.org availability  ("SoldOut" / "LimitedAvailability" / "InStock")
 *
 * Centralising the lookup avoids the nested-ternary pattern that Sonar's
 * S3358 rule flags in JSX, and keeps the three mappings in lockstep so
 * the colour + label + structured-data signal can never drift apart.
 */

export type VehicleStatusToken = "available" | "reserved" | "pending" | "sold"

export interface VehicleStatusDisplay {
  /** Long label used inside CTA-disabled banners. */
  longLabel: string
  /** Short banner label used at the top of the VDP. */
  shortLabel: string
  /** Tailwind background+text classes for the disabled-CTA banner. */
  bannerClassName: string
  /** Tailwind text-only class for the inline header banner. */
  inlineClassName: string
  /** schema.org/ItemAvailability identifier emitted in JSON-LD. */
  schemaAvailability:
    | "https://schema.org/InStock"
    | "https://schema.org/LimitedAvailability"
    | "https://schema.org/SoldOut"
}

const STATUS_DISPLAY: Record<VehicleStatusToken, VehicleStatusDisplay> = {
  available: {
    longLabel: "Available",
    shortLabel: "Available",
    bannerClassName:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    inlineClassName: "text-emerald-600",
    schemaAvailability: "https://schema.org/InStock",
  },
  reserved: {
    longLabel: "Vehicle Reserved",
    shortLabel: "This vehicle is reserved",
    bannerClassName:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
    inlineClassName: "text-yellow-600",
    schemaAvailability: "https://schema.org/LimitedAvailability",
  },
  pending: {
    longLabel: "Sale Pending",
    shortLabel: "Sale pending",
    bannerClassName:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
    inlineClassName: "text-orange-600",
    schemaAvailability: "https://schema.org/LimitedAvailability",
  },
  sold: {
    longLabel: "Vehicle Sold",
    shortLabel: "This vehicle has been sold",
    bannerClassName:
      "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    inlineClassName: "text-red-600",
    schemaAvailability: "https://schema.org/SoldOut",
  },
}

/**
 * Map a raw vehicle status string to its display tokens. Falls back to the
 * "sold" tokens for any unknown value — that is the safest visible state
 * for an inventory record we no longer recognise (no purchase CTA, clear
 * messaging, no false claim of availability).
 */
export function getVehicleStatusDisplay(
  status: string | null | undefined
): VehicleStatusDisplay {
  if (status && status in STATUS_DISPLAY) {
    return STATUS_DISPLAY[status as VehicleStatusToken]
  }
  return STATUS_DISPLAY.sold
}
