/**
 * Overlay config loader — resolves the active profile and returns
 * flattened scene constants for the SpinViewer canvas renderer.
 */

import overlayJson from "./overlay.json"
import type { OverlayConfig, OverlayProfile } from "./overlay-types"

const config = overlayJson as unknown as OverlayConfig

/** Get the full overlay config. */
export function getOverlayConfig(): OverlayConfig {
  return config
}

/** Get the active profile (based on config.activeProfile). */
export function getActiveProfile(): OverlayProfile {
  const profile = config.profiles[config.activeProfile]
  if (!profile) {
    const fallbackKey = Object.keys(config.profiles)[0]
    return config.profiles[fallbackKey]
  }
  return profile
}

/** Get a specific profile by ID, or the active one if omitted. */
export function getProfile(profileId?: string): OverlayProfile {
  const id = profileId ?? config.activeProfile
  const profile = config.profiles[id]
  if (!profile) {
    throw new Error(
      `Overlay profile "${id}" not found. Available: ${Object.keys(config.profiles).join(", ")}`,
    )
  }
  return profile
}

/** List all profile IDs. */
export function getProfileIds(): string[] {
  return Object.keys(config.profiles)
}

/** List all available profile IDs with labels. */
export function listProfiles(): Array<{ id: string; label: string }> {
  return Object.values(config.profiles).map((p) => ({ id: p.id, label: p.label }))
}

/**
 * Flattened scene constants for the SpinViewer canvas renderer.
 * Merges global config + active profile into a simple value bag.
 */
export interface SceneConstants {
  // Canvas layout
  horizonY: number
  carFill: number
  tireContactY: number
  groundPush: number

  // Shadow ellipse geometry (from global config)
  shadowEllipseRx: number
  shadowEllipseRy: number

  // Floor colors (from profile)
  wallTop: string
  wallMid: string
  floorNear: string
  floorFar: string

  // Shadow (from profile)
  shadowMaxOpacity: number
  underbodyAO: number

  // Reflection (from profile)
  reflectionMaxOpacity: number
  reflectionFadeDistance: number

  // Tire merge (from global)
  tireMergeEnabled: boolean
}

/**
 * Resolve scene constants from overlay config + profile.
 * CAR_FILL and GROUND_PUSH are layout constants not in the overlay spec,
 * so they remain as defaults but can be overridden.
 */
export function resolveSceneConstants(profileId?: string): SceneConstants {
  const profile = getProfile(profileId)
  const { global: g } = config

  return {
    horizonY: g.horizonY,
    carFill: 0.90,
    tireContactY: g.shadowEllipse.cy,
    groundPush: 0.06,

    shadowEllipseRx: g.shadowEllipse.rx,
    shadowEllipseRy: g.shadowEllipse.ry,

    wallTop: profile.colors.wallTop,
    wallMid: profile.colors.wallMid,
    floorNear: profile.colors.floorNear,
    floorFar: profile.colors.floorFar,

    shadowMaxOpacity: profile.shadow.maxOpacity,
    underbodyAO: profile.shadow.underbodyAO,

    reflectionMaxOpacity: profile.reflection.maxOpacity,
    reflectionFadeDistance: profile.reflection.fadeDistanceVehicleHeight,

    tireMergeEnabled: g.tireMerge.enabled,
  }
}
