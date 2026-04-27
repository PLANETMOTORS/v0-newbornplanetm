/**
 * lib/ab-testing.ts
 *
 * Lightweight A/B testing framework for Planet Motors.
 *
 * Design goals:
 *  - Zero external dependencies — uses crypto.randomUUID() + localStorage
 *  - Deterministic: same visitor always gets the same variant (sticky assignment)
 *  - Integrates with existing GTM dataLayer for experiment tracking
 *  - Works with the existing FeatureGate / isFeatureEnabled system
 *  - Server-safe: all browser APIs are guarded with typeof globalThis.window checks
 *
 * Usage:
 *   // Define experiments in one place:
 *   const EXPERIMENTS = {
 *     'hero-cta': { variants: ['control', 'treatment-a', 'treatment-b'], weights: [50, 25, 25] },
 *     'search-placement': { variants: ['top', 'sidebar'], weights: [50, 50] },
 *   } satisfies ExperimentMap
 *
 *   // In a component:
 *   const variant = useABTest('hero-cta', EXPERIMENTS['hero-cta'])
 *   // variant === 'control' | 'treatment-a' | 'treatment-b'
 *
 *   // Or imperatively:
 *   const variant = getVariant('hero-cta', EXPERIMENTS['hero-cta'])
 */

import { pushToDataLayer } from "@/components/analytics/google-tag-manager"
import { randomFloat } from "@/lib/util/random"

// ── Types ──────────────────────────────────────────────────────────────────

export interface Experiment<V extends string = string> {
  /** Variant names — first is always the control */
  variants: readonly [V, ...V[]]
  /**
   * Traffic weights (must sum to 100).
   * Defaults to equal split if omitted.
   */
  weights?: readonly number[]
}

export type ExperimentMap = Record<string, Experiment>

/** Stored in localStorage under AB_STORAGE_KEY */
type AssignmentStore = Record<string, string>

// ── Constants ──────────────────────────────────────────────────────────────

const AB_STORAGE_KEY = "pm_ab_assignments"
const VISITOR_ID_KEY = "pm_visitor_id"

// ── Visitor ID ─────────────────────────────────────────────────────────────

/**
 * Returns a stable anonymous visitor ID, creating one if needed.
 * Stored in localStorage so it persists across sessions.
 */
export function getVisitorId(): string {
  if (globalThis.window === undefined) return "ssr"
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(VISITOR_ID_KEY, id)
    return id
  } catch {
    return "ssr"
  }
}

// ── Assignment store ───────────────────────────────────────────────────────

function loadAssignments(): AssignmentStore {
  if (globalThis.window === undefined) return {}
  try {
    return JSON.parse(localStorage.getItem(AB_STORAGE_KEY) ?? "{}")
  } catch {
    return {}
  }
}

function saveAssignment(experimentId: string, variant: string): void {
  if (globalThis.window === undefined) return
  try {
    const store = loadAssignments()
    store[experimentId] = variant
    localStorage.setItem(AB_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}

// ── Variant selection ──────────────────────────────────────────────────────

/**
 * Selects a variant using weighted random selection.
 * Uses Math.random() — for cryptographic randomness use getVisitorId() as seed.
 */
function pickVariant<V extends string>(experiment: Experiment<V>): V {
  const { variants, weights } = experiment
  const n = variants.length

  // Default: equal weights
  const w = weights ?? new Array(n).fill(100 / n)

  // Validate weights sum to ~100
  const total = w.reduce((a, b) => a + b, 0)
  // Use crypto-backed RNG so SonarCloud does not flag this as S2245.
  // (A/B selection is not security-sensitive, but crypto.getRandomValues is
  // available everywhere we run and removes ambiguity.)
  const rand = randomFloat() * total

  let cumulative = 0
  for (let i = 0; i < n; i++) {
    cumulative += w[i]
    if (rand < cumulative) return variants[i]
  }
  return variants[0] // fallback to control
}

// ── Core API ───────────────────────────────────────────────────────────────

/**
 * Returns the assigned variant for an experiment.
 * Assignment is sticky — the same visitor always gets the same variant.
 * Fires a GTM `experiment_impression` event on first assignment.
 *
 * @param experimentId  Unique experiment key (e.g. 'hero-cta-v2')
 * @param experiment    Experiment config with variants and optional weights
 * @returns             The assigned variant string
 */
export function getVariant<V extends string>(
  experimentId: string,
  experiment: Experiment<V>
): V {
  if (globalThis.window === undefined) {    // SSR: always return control
    return experiment.variants[0]
  }

  const store = loadAssignments()

  // Return existing assignment if present
  if (store[experimentId] && experiment.variants.includes(store[experimentId] as V)) {
    return store[experimentId] as V
  }

  // New assignment
  const variant = pickVariant(experiment)
  saveAssignment(experimentId, variant)

  // Fire GTM impression event
  pushToDataLayer({
    event: "experiment_impression",
    experiment_id: experimentId,
    experiment_variant: variant,
    visitor_id: getVisitorId(),
  })

  return variant
}

/**
 * Records a conversion event for an experiment.
 * Call this when the goal action occurs (e.g. form submit, CTA click).
 *
 * @param experimentId  The experiment key
 * @param goalName      Human-readable goal (e.g. 'lead_submitted', 'cta_clicked')
 * @param value         Optional numeric value (e.g. vehicle price)
 */
export function trackExperimentConversion(
  experimentId: string,
  goalName: string,
  value?: number
): void {
  const store = loadAssignments()
  const variant = store[experimentId]
  if (!variant) return // not enrolled in this experiment

  pushToDataLayer({
    event: "experiment_conversion",
    experiment_id: experimentId,
    experiment_variant: variant,
    goal_name: goalName,
    visitor_id: getVisitorId(),
    ...(value !== undefined ? { conversion_value: value } : {}),
  })
}

/**
 * Returns all current experiment assignments for debugging.
 */
export function getAllAssignments(): AssignmentStore {
  return loadAssignments()
}

/**
 * Clears all experiment assignments (useful for testing).
 */
export function clearAssignments(): void {
  if (globalThis.window === undefined) return
  try {
    localStorage.removeItem(AB_STORAGE_KEY)
  } catch {
    // ignore
  }
}

// ── Pre-defined Planet Motors experiments ─────────────────────────────────

/**
 * Active experiments registry.
 *
 * Add new experiments here. Each key is the experiment ID used in
 * getVariant() and trackExperimentConversion() calls.
 *
 * Naming convention: <component>-<hypothesis>-v<iteration>
 */
export const EXPERIMENTS = {
  /** Hero section CTA button copy */
  "hero-cta-copy": {
    variants: ["control", "urgency", "social-proof"] as const,
    weights: [50, 25, 25],
  },
  /** Lead capture form position on VDP */
  "vdp-lead-form-position": {
    variants: ["sidebar", "below-gallery", "sticky-bottom"] as const,
    weights: [34, 33, 33],
  },
  /** Search bar placement in header */
  "search-placement": {
    variants: ["header", "hero"] as const,
    weights: [50, 50],
  },
  /** Finance CTA on inventory cards */
  "inventory-card-cta": {
    variants: ["view-details", "get-financing", "check-price"] as const,
    weights: [34, 33, 33],
  },
} satisfies ExperimentMap

export type ExperimentId = keyof typeof EXPERIMENTS
