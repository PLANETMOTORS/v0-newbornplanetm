/**
 * lib/typesense/search.ts
 *
 * Smart Suggestions — "Did You Mean?" helper for the search bar.
 *
 * Uses Typesense's built-in typo-tolerance and multi-field search to return
 * a ranked list of suggestion strings based on the current vehicles collection.
 *
 * Strategy:
 *  1. Run a Typesense search with num_typos=2 and prefix=true so it catches
 *     misspellings and partial words (e.g. "tesle" → "Tesla", "bm" → "BMW").
 *  2. Extract unique make/model/trim values from the returned hits and deduplicate.
 *  3. If Typesense is not configured, fall back to an empty array (graceful degradation).
 *
 * Usage:
 *   const suggestions = await getSmartSuggestions("tesle")
 *   // → ["Tesla Model 3", "Tesla Model Y", "Tesla Model S"]
 */

import { getSearchClient, isTypesenseConfigured, VEHICLES_COLLECTION } from "./client"
import { logger } from "@/lib/logger"

// ── Types ──────────────────────────────────────────────────────────────────

export interface SmartSuggestion {
  /** The display label shown in the search dropdown */
  label: string
  /** The canonical query string to use when the user selects this suggestion */
  query: string
  /** The field this suggestion was derived from */
  field: "make" | "model" | "trim" | "make_model"
}

// ── Constants ──────────────────────────────────────────────────────────────

/** Maximum number of suggestions to return */
const MAX_SUGGESTIONS = 6

/** Minimum query length before we attempt suggestions */
const MIN_QUERY_LENGTH = 2

// ── Main export ────────────────────────────────────────────────────────────

/**
 * Returns "did-you-mean" style suggestions for the given query string.
 *
 * @param query - Raw user input from the search bar
 * @returns Array of SmartSuggestion objects, ordered by relevance
 */
export async function getSmartSuggestions(query: string): Promise<SmartSuggestion[]> {
  const trimmed = query.trim()

  if (trimmed.length < MIN_QUERY_LENGTH) return []
  if (!isTypesenseConfigured()) return []

  const client = getSearchClient()
  if (!client) return []

  try {
    const result = await client
      .collections(VEHICLES_COLLECTION)
      .documents()
      .search({
        q: trimmed,
        // Search across the fields most useful for suggestions
        query_by: "make,model,trim",
        // Only available vehicles
        filter_by: "status:=[available,reserved]",
        // We only need a small sample to build suggestions from
        per_page: 20,
        // Allow up to 2 typos — catches "tesle", "bmw x5i", etc.
        num_typos: 2,
        // Enable prefix matching — "tes" matches "Tesla"
        prefix: "true",
        // Sort by relevance (default) then recency
        sort_by: "_text_match:desc,created_at:desc",
        // We only need make/model/trim from each hit
        include_fields: "make,model,trim",
      })

    const hits = (result.hits || []) as Array<{ document: Record<string, unknown> }>

    return buildSuggestions(trimmed, hits)
  } catch (err) {
    logger.warn("[SmartSuggestions] Typesense query failed:", err)
    return []
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────

/** Add a suggestion if the key hasn't been seen yet. */
function addUnique(
  seen: Set<string>,
  suggestions: SmartSuggestion[],
  label: string,
  field: SmartSuggestion["field"],
): void {
  const key = label.toLowerCase()
  if (!seen.has(key)) {
    seen.add(key)
    suggestions.push({ label, query: label, field })
  }
}

/**
 * Build a deduplicated, ranked list of suggestions from Typesense hits.
 *
 * Priority order:
 *  1. Exact make matches (e.g. "Tesla")
 *  2. Make + Model combinations (e.g. "Tesla Model 3")
 *  3. Trim-level matches (e.g. "Tesla Model 3 Long Range")
 */
function buildSuggestions(
  query: string,
  hits: Array<{ document: Record<string, unknown> }>
): SmartSuggestion[] {
  const seen = new Set<string>()
  const suggestions: SmartSuggestion[] = []
  const lowerQuery = query.toLowerCase()

  // S6551: never let a non-string `make`/`model`/`trim` slip into String()
  // (would render "[object Object]"). Treat anything non-string as empty.
  const safeStr = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

  for (const hit of hits) {
    const make = safeStr(hit.document.make)
    const model = safeStr(hit.document.model)
    const trim = safeStr(hit.document.trim)

    // Pass 1: makes that match the query
    if (make?.toLowerCase().includes(lowerQuery)) {
      addUnique(seen, suggestions, make, "make")
    }

    // Pass 2: make+model combinations
    if (make && model) {
      addUnique(seen, suggestions, `${make} ${model}`, "make_model")
    }

    // Pass 3: make+model+trim combinations
    if (make && model && trim) {
      addUnique(seen, suggestions, `${make} ${model} ${trim}`, "trim")
    }
  }

  return suggestions.slice(0, MAX_SUGGESTIONS)
}

// ── Convenience re-export for the search bar component ────────────────────

/**
 * Lightweight wrapper that returns just the label strings — useful for
 * simple autocomplete dropdowns that don't need the full SmartSuggestion shape.
 *
 * @example
 *   const labels = await getSuggestionLabels("bmw")
 *   // → ["BMW", "BMW X5", "BMW 3 Series", ...]
 */
export async function getSuggestionLabels(query: string): Promise<string[]> {
  const suggestions = await getSmartSuggestions(query)
  return suggestions.map((s) => s.label)
}
