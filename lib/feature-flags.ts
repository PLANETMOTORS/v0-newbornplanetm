"use client"

import React from "react"

/**
 * Phase-based feature gating for incremental rollout.
 *
 * Environment variables:
 *   NEXT_PUBLIC_ENABLED_PHASES  – comma-separated phase numbers (e.g. "1,2,3").
 *                                 If unset, ALL phases are enabled (backward-compatible).
 *   NEXT_PUBLIC_FEATURES        – comma-separated feature keys (e.g. "dark-mode,new-checkout").
 *                                 If unset, NO individual features are enabled.
 */

// ── Phase enum ──────────────────────────────────────────────────────────────

export enum Phase {
  Design = 1,
  Inventory = 2,
  SEO = 3,
  Finance = 4,
  Trust = 5,
}

/** All phases in order – used as the default when the env var is absent. */
const ALL_PHASES: readonly Phase[] = [
  Phase.Design,
  Phase.Inventory,
  Phase.SEO,
  Phase.Finance,
  Phase.Trust,
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseEnabledPhases(): Set<Phase> {
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_ENABLED_PHASES
      : undefined

  // S7735: positive condition first — bail out only when the env var
  // contains a usable value.
  if (raw && raw.trim() !== "") {
    const parsed = new Set<Phase>()
    for (const token of raw.split(",")) {
      const num = Number(token.trim())
      if (!Number.isNaN(num) && Object.values(Phase).includes(num as Phase)) {
        parsed.add(num as Phase)
      }
    }
    return parsed
  }
  return new Set(ALL_PHASES)
}

function parseEnabledFeatures(): Set<string> {
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_FEATURES
      : undefined

  // S7735: positive condition first — only parse when env var is non-empty.
  const features = new Set<string>()
  if (raw && raw.trim() !== "") {
    for (const token of raw.split(",")) {
      const trimmed = token.trim()
      if (trimmed) {
        features.add(trimmed)
      }
    }
  }
  return features
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns `true` when the given phase is enabled.
 * When `NEXT_PUBLIC_ENABLED_PHASES` is unset, every phase is enabled.
 */
export function isPhaseEnabled(phase: Phase): boolean {
  return parseEnabledPhases().has(phase)
}

/**
 * Returns `true` when the given feature key appears in
 * `NEXT_PUBLIC_FEATURES` (comma-separated).
 * When the env var is unset, no individual features are enabled.
 */
export function isFeatureEnabled(feature: string): boolean {
  return parseEnabledFeatures().has(feature)
}

// ── React component ─────────────────────────────────────────────────────────

export interface FeatureGateProps {
  /** Render children only when this phase is enabled. */
  phase?: Phase
  /** Render children only when this feature key is enabled. */
  feature?: string
  /** Optional fallback UI when the gate is closed. */
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Conditionally renders children based on phase or feature flag.
 *
 * If both `phase` and `feature` are provided, **both** must be enabled.
 * If neither is provided, children are always rendered.
 */
export function FeatureGate({
  phase,
  feature,
  fallback = null,
  children,
}: FeatureGateProps) {
  const phaseOk = phase == null || isPhaseEnabled(phase)
  const featureOk = feature == null || isFeatureEnabled(feature)

  if (phaseOk && featureOk) {
    return React.createElement(React.Fragment, null, children)
  }

  return React.createElement(React.Fragment, null, fallback)
}
