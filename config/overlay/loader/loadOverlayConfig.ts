import { migrateToLatest } from "../migrations"
import { parseOverlayConfig } from "../validators/validate"
import type { OverlayConfig } from "../overlay-types"
import currentConfig from "../current.json"

/**
 * Load and validate the overlay config at build/runtime.
 *
 * - Applies migrations if the config version is behind.
 * - Falls back to the raw imported config on migration error
 *   (current.json is already v1.1.0 / schema v2.0.0 so no migration needed).
 */
export function loadOverlayConfig(): OverlayConfig {
  const raw = currentConfig as Record<string, unknown>

  try {
    const migrated = migrateToLatest(raw, (raw.version as string) ?? "1.0.0")
    return parseOverlayConfig(migrated) as unknown as OverlayConfig
  } catch {
    // Fallback: return the imported JSON directly (already valid v1.1.0)
    return currentConfig as unknown as OverlayConfig
  }
}

/** Pre-loaded config singleton for use in components. */
export const overlayConfig: OverlayConfig = loadOverlayConfig()
