/**
 * lib/hooks/use-ab-test.ts
 *
 * React hook for A/B test variant assignment.
 *
 * Wraps getVariant() from lib/ab-testing.ts with proper React hydration
 * handling — returns 'control' on the server and during hydration to
 * prevent SSR mismatches, then switches to the real variant after mount.
 *
 * @example
 *   import { useABTest } from "@/lib/hooks/use-ab-test"
 *   import { EXPERIMENTS, trackExperimentConversion } from "@/lib/ab-testing"
 *
 *   function HeroCTA() {
 *     const variant = useABTest("hero-cta-copy", EXPERIMENTS["hero-cta-copy"])
 *
 *     const label = {
 *       control:      "Browse Inventory",
 *       urgency:      "View Limited Stock →",
 *       "social-proof": "Join 500+ Happy Buyers",
 *     }[variant]
 *
 *     return (
 *       <Button onClick={() => trackExperimentConversion("hero-cta-copy", "cta_clicked")}>
 *         {label}
 *       </Button>
 *     )
 *   }
 */

"use client"

import { useState, useEffect } from "react"
import { getVariant, type Experiment } from "@/lib/ab-testing"

/**
 * Returns the A/B test variant for the current visitor.
 *
 * - Server / pre-hydration: always returns `experiment.variants[0]` (control)
 * - After hydration: returns the sticky variant from localStorage
 *
 * @param experimentId  Unique experiment key matching an entry in EXPERIMENTS
 * @param experiment    Experiment config (variants + optional weights)
 */
export function useABTest<V extends string>(
  experimentId: string,
  experiment: Experiment<V>
): V {
  // Start with control to avoid SSR hydration mismatch
  const [variant, setVariant] = useState<V>(experiment.variants[0])

  useEffect(() => {
    // After mount, resolve the real (sticky) variant
    setVariant(getVariant(experimentId, experiment))
  }, [experimentId, experiment])

  return variant
}
