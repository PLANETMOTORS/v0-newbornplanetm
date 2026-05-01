"use client"

/**
 * components/search-autocomplete.tsx
 *
 * Planet Ultra — Inventory Search Bar
 *
 * Hybrid architecture:
 *   Job 1 (on focus):  Dynamic popular searches from Supabase RPC,
 *                       cached in Redis (15-min TTL).
 *   Job 2 (on typing): Predictive type-ahead from Typesense via
 *                       /api/search/suggestions (typo-tolerant, sub-5ms).
 *
 * AODA / WCAG AA compliant:
 *   - role="combobox" on input
 *   - role="listbox" on dropdown, role="option" on each result
 *   - aria-expanded, aria-activedescendant, aria-autocomplete="list"
 *   - Full arrow key + Enter + Escape keyboard navigation
 *   - Focus trap on mobile modal, body scroll lock
 *   - prefers-reduced-motion respected
 *   - Visible focus rings (focus-visible:ring-2)
 *   - Minimum 44px touch targets
 *
 * Supports two rendering modes via `variant` prop:
 *   - "bar"  (default): Full search bar — used in desktop header
 *   - "icon": Compact search icon button — used in mobile header
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { PopularSearch } from "@/lib/search/data"
import type { SmartSuggestion } from "@/lib/typesense/search"

// ── Config ─────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 200
const POPULAR_CACHE_TTL_MS = 15 * 60 * 1000 // 15 min client-side staleness
const MIN_QUERY_LENGTH = 2

// ── Types ──────────────────────────────────────────────────────────────────

interface SearchGroup {
  group: string
  items: Array<{
    label: string
    count?: number
    href: string
    field?: SmartSuggestion["field"]
  }>
}

interface PopularCacheEntry {
  data: PopularSearch[] | null
  ts: number
}

// ── Client-side data fetchers ──────────────────────────────────────────────

let popularCache: PopularCacheEntry = { data: null, ts: 0 }

async function fetchPopularSearches(): Promise<PopularSearch[]> {
  const now = Date.now()
  if (popularCache.data && now - popularCache.ts < POPULAR_CACHE_TTL_MS) {
    return popularCache.data
  }

  try {
    const res = await fetch("/api/search/popular")
    if (!res.ok) return popularCache.data ?? []
    const data = (await res.json()) as PopularSearch[]
    popularCache = { data, ts: Date.now() }
    return data
  } catch {
    return popularCache.data ?? []
  }
}

async function fetchPredictiveResults(
  query: string,
  signal?: AbortSignal,
): Promise<SearchGroup[] | null> {
  try {
    const res = await fetch(
      `/api/search/suggestions?q=${encodeURIComponent(query.trim())}`,
      { signal },
    )
    if (signal?.aborted) return null
    if (!res.ok) return []

    const data = (await res.json()) as { suggestions: SmartSuggestion[] }
    const suggestions = data.suggestions ?? []
    if (suggestions.length === 0) return []

    // Group Typesense flat suggestions into UI groups
    const makes: SearchGroup["items"] = []
    const models: SearchGroup["items"] = []
    const trims: SearchGroup["items"] = []

    for (const s of suggestions) {
      const item = {
        label: s.label,
        href: `/inventory?q=${encodeURIComponent(s.query)}`,
        field: s.field,
      }
      switch (s.field) {
        case "make":
          makes.push(item)
          break
        case "make_model":
          models.push(item)
          break
        case "trim":
          trims.push(item)
          break
        default:
          models.push(item)
      }
    }

    const groups: SearchGroup[] = []
    if (makes.length > 0) groups.push({ group: "Makes", items: makes })
    if (models.length > 0) groups.push({ group: "Models", items: models })
    if (trims.length > 0) groups.push({ group: "Trims", items: trims })
    return groups
  } catch {
    if (signal?.aborted) return null
    return []
  }
}

// ── Badge component ────────────────────────────────────────────────────────

const BADGE_MAP: Record<string, { label: string; bg: string }> = {
  body_style: { label: "Body", bg: "bg-blue-100 text-blue-800" },
  fuel: { label: "Fuel", bg: "bg-green-100 text-green-800" },
  price: { label: "Price", bg: "bg-amber-100 text-amber-800" },
  make: { label: "Make", bg: "bg-slate-100 text-slate-700" },
}

function TypeBadge({ type }: Readonly<{ type: string }>) {
  const badge = BADGE_MAP[type]
  if (!badge) return null
  return (
    <span
      aria-hidden="true"
      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${badge.bg}`}
    >
      {badge.label}
    </span>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function SearchAutocomplete({
  variant = "bar",
}: Readonly<{ variant?: "bar" | "icon" }>) {
  const router = useRouter()

  // State
  const [isActive, setIsActive] = useState(false)
  const [query, setQuery] = useState("")
  const [popular, setPopular] = useState<PopularSearch[]>([])
  const [results, setResults] = useState<SearchGroup[]>([])
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [announcement, setAnnouncement] = useState("")

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const listboxRef = useRef<HTMLDivElement>(null)

  // ── Flatten all selectable items for keyboard navigation ──
  const flatItems = useMemo(() => {
    if (query.length >= MIN_QUERY_LENGTH && results.length > 0) {
      return results.flatMap((group) =>
        group.items.map((item) => ({ ...item, group: group.group })),
      )
    }
    if (query.length >= MIN_QUERY_LENGTH) {
      return [] // no results state — don't expose invisible popular items
    }
    return popular.map((item) => ({ ...item, group: "popular" }))
  }, [query, results, popular])

  // ── Open search ──
  const openSearch = useCallback(async () => {
    setIsActive(true)
    setActiveIndex(-1)
    const data = await fetchPopularSearches()
    setPopular(data)
  }, [])

  // ── Close search ──
  const closeSearch = useCallback(() => {
    setIsActive(false)
    setQuery("")
    setResults([])
    setActiveIndex(-1)
    inputRef.current?.blur()
    abortRef.current?.abort()
  }, [])

  // ── Navigate to result ──
  const navigateTo = useCallback(
    (href: string) => {
      closeSearch()
      router.push(href)
    },
    [closeSearch, router],
  )

  // ── Outside click — pointerdown, not blur ──
  useEffect(() => {
    if (!isActive) return

    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeSearch()
      }
    }

    globalThis.document.addEventListener("pointerdown", handlePointerDown)
    return () =>
      globalThis.document.removeEventListener("pointerdown", handlePointerDown)
  }, [isActive, closeSearch])

  // ── Escape key ──
  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        closeSearch()
      }
    }

    globalThis.document.addEventListener("keydown", handleKeyDown)
    return () =>
      globalThis.document.removeEventListener("keydown", handleKeyDown)
  }, [isActive, closeSearch])

  // ── Body scroll lock on mobile ──
  useEffect(() => {
    if (isActive) {
      globalThis.document.body.style.overflow = "hidden"
    } else {
      globalThis.document.body.style.overflow = ""
    }
    return () => {
      globalThis.document.body.style.overflow = ""
    }
  }, [isActive])

  // ── Debounced predictive search ──
  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setResults([])
      setIsLoadingResults(false)
      abortRef.current?.abort()
      return
    }

    setIsLoadingResults(true)
    setActiveIndex(-1)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timer = globalThis.setTimeout(async () => {
      const data = await fetchPredictiveResults(query, controller.signal)
      if (data !== null) {
        setResults(data)
        setIsLoadingResults(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      globalThis.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // ── Keyboard navigation ──
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const len = flatItems.length

    if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < len) {
        navigateTo(flatItems[activeIndex].href)
      } else if (query.trim().length >= MIN_QUERY_LENGTH) {
        navigateTo(`/inventory?q=${encodeURIComponent(query.trim())}`)
      }
      return
    }

    if (len === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) => (prev < len - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : len - 1))
        break
      default:
        break
    }
  }

  // ── Scroll active option into view ──
  useEffect(() => {
    if (activeIndex < 0) return
    const el = listboxRef.current?.querySelector(
      `[data-index="${activeIndex}"]`,
    )
    el?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  // ── ARIA-LIVE announcements ──
  useEffect(() => {
    if (!isActive) return

    if (isLoadingResults) {
      setAnnouncement("Searching inventory...")
    } else if (query.length >= MIN_QUERY_LENGTH) {
      const totalResults = results.reduce(
        (sum, group) => sum + group.items.length,
        0,
      )
      setAnnouncement(
        totalResults === 0
          ? `No vehicles found matching ${query}`
          : `${totalResults} result${totalResults === 1 ? "" : "s"} found`,
      )
    } else if (popular.length > 0) {
      setAnnouncement(
        `${popular.length} popular searches available. Use arrow keys to navigate.`,
      )
    }
  }, [isActive, isLoadingResults, results, popular, query])

  // ── Focus trap on mobile ──
  useEffect(() => {
    if (!isActive) return

    const isMobile =
      globalThis.window !== undefined &&
      globalThis.matchMedia("(max-width: 767px)").matches
    if (!isMobile) return

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return

      const container = containerRef.current
      if (!container) return

      const focusable = container.querySelectorAll<HTMLElement>(
        'input, button, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && globalThis.document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (
        !e.shiftKey &&
        globalThis.document.activeElement === last
      ) {
        e.preventDefault()
        first.focus()
      }
    }

    globalThis.document.addEventListener("keydown", handleTab)
    return () =>
      globalThis.document.removeEventListener("keydown", handleTab)
  }, [isActive])

  // ── Reduced motion preference ──
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    if (globalThis.window === undefined) return
    const mq = globalThis.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    function onChange(e: MediaQueryListEvent) {
      setReducedMotion(e.matches)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // ── Computed render state ──
  const activeOptionId =
    activeIndex >= 0 ? `search-option-${activeIndex}` : undefined
  const showPredictive = query.length >= MIN_QUERY_LENGTH
  const showPopular = !showPredictive && popular.length > 0
  const hasContent = showPredictive ? results.length > 0 : showPopular
  const noResults =
    showPredictive && !isLoadingResults && results.length === 0

  const t = reducedMotion ? "duration-0" : "duration-200"
  const tFast = reducedMotion ? "duration-0" : "duration-150"
  const tSnap = reducedMotion ? "duration-0" : "duration-100"

  // ═════════════════════════════════════════════════════════════
  // VARIANT: "icon" — mobile compact trigger
  // ═════════════════════════════════════════════════════════════
  if (variant === "icon" && !isActive) {
    return (
      <button
        type="button"
        onClick={openSearch}
        className="p-2.5 rounded-full hover:bg-gray-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c] min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Search inventory"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="8.5" cy="8.5" r="5.5" />
          <line x1="13" y1="13" x2="17" y2="17" />
        </svg>
      </button>
    )
  }

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════
  return (
    <>
      {/* Screen reader live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Overlay backdrop */}
      <div
        aria-hidden="true"
        className={`
          fixed inset-0 z-40 bg-black/50 backdrop-blur-sm
          transition-opacity ${t}
          ${isActive ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Search container */}
      <div
        ref={containerRef}
        className={`
          relative z-50 w-full max-w-2xl mx-auto
          ${isActive ? "fixed inset-0 md:relative md:inset-auto" : ""}
        `}
      >
        <div
          className={`
            ${
              isActive
                ? "flex flex-col h-full bg-white md:bg-transparent md:h-auto md:rounded-xl"
                : ""
            }
          `}
          {...(isActive
            ? {
                role: "dialog" as const,
                "aria-modal": "true" as const,
                "aria-label": "Search inventory",
              }
            : {})}
        >
          {/* Mobile header — active only */}
          {isActive && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 md:hidden">
              <span className="text-sm font-semibold text-[#0f1e3d] tracking-wide">
                Search Inventory
              </span>
              <button
                type="button"
                onClick={closeSearch}
                className="p-2.5 -mr-1 rounded-full hover:bg-gray-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c] min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close search"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="5" x2="15" y2="15" />
                  <line x1="15" y1="5" x2="5" y2="15" />
                </svg>
              </button>
            </div>
          )}

          {/* Input bar */}
          <div
            className={`
              relative flex items-center gap-3 px-4 py-3
              bg-white border rounded-xl
              transition-all ${t} ease-out
              ${
                isActive
                  ? "border-[#c9a84c] shadow-lg shadow-[#c9a84c]/10 rounded-none md:rounded-xl md:rounded-b-none"
                  : "border-gray-200 shadow-sm hover:shadow-md hover:border-[#c9a84c]/40 cursor-text"
              }
            `}
            onClick={() => {
              if (!isActive) {
                inputRef.current?.focus()
              }
            }}
            onKeyDown={(e) => {
              if (!isActive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault()
                inputRef.current?.focus()
              }
            }}
            role="presentation"
          >
            {/* Search icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke={isActive ? "#c9a84c" : "#9ca3af"}
              strokeWidth="2"
              strokeLinecap="round"
              className={`flex-shrink-0 transition-colors ${t}`}
              aria-hidden="true"
            >
              <circle cx="8.5" cy="8.5" r="5.5" />
              <line x1="13" y1="13" x2="17" y2="17" />
            </svg>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={isActive}
              aria-controls="search-listbox"
              aria-activedescendant={activeOptionId}
              aria-autocomplete="list"
              aria-label="Search inventory by make, model, body style, or price"
              data-testid="search-input"
              placeholder="Search by make, model, or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={openSearch}
              onKeyDown={handleInputKeyDown}
              className="
                flex-1 bg-transparent outline-none
                text-[#0f1e3d] text-base placeholder:text-gray-400
                caret-[#c9a84c]
              "
              autoComplete="off"
              spellCheck="false"
            />

            {/* Clear button */}
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  setResults([])
                  setActiveIndex(-1)
                  inputRef.current?.focus()
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c] min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Clear search"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              </button>
            )}

            {/* Loading spinner */}
            {isLoadingResults && (
              <div
                role="status"
                aria-label="Loading search results"
                className={`w-5 h-5 border-2 border-gray-200 border-t-[#c9a84c] rounded-full flex-shrink-0 ${reducedMotion ? "" : "animate-spin"}`}
              />
            )}
          </div>

          {/* Dropdown panel */}
          <div
            id="search-listbox"
            role="listbox"
            ref={listboxRef}
            aria-label="Search suggestions"
            data-testid="search-dropdown"
            className={`
              md:absolute md:top-full md:left-0 md:right-0
              bg-white md:border md:border-t-0 md:border-gray-200
              md:rounded-b-xl md:shadow-xl
              transition-all ${tFast} ease-out
              flex-1 overflow-y-auto
              ${
                isActive && hasContent
                  ? "opacity-100 md:max-h-[420px]"
                  : isActive && noResults
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none md:max-h-0 overflow-hidden"
              }
            `}
          >
            {/* Popular searches */}
            {showPopular && (
              <div className="p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Popular Searches
                </p>
                <div className="space-y-1">
                  {popular.map((item, i) => {
                    const isHighlighted = activeIndex === i
                    return (
                      <button
                        key={`popular-${item.label}`}
                        id={`search-option-${i}`}
                        role="option"
                        aria-selected={isHighlighted}
                        data-index={i}
                        onPointerDown={(e) => {
                          e.preventDefault()
                          navigateTo(item.href)
                        }}
                        className={`
                          w-full flex items-center justify-between gap-3
                          px-3 py-2.5 rounded-lg text-left min-h-[44px]
                          transition-colors ${tSnap}
                          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c]
                          ${
                            isHighlighted
                              ? "bg-[#0f1e3d] text-white"
                              : "text-[#0f1e3d] hover:bg-gray-50"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="flex-shrink-0 opacity-40"
                            aria-hidden="true"
                          >
                            <path d="M6 2L10 8L6 14" />
                          </svg>
                          <span className="text-sm font-medium truncate">
                            {item.label}
                          </span>
                          <TypeBadge type={item.type} />
                        </div>
                        <span
                          className={`
                            text-xs font-mono tabular-nums flex-shrink-0
                            ${isHighlighted ? "text-white/70" : "text-gray-400"}
                          `}
                        >
                          {item.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {isLoadingResults && showPredictive && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 animate-pulse"
                  >
                    <div className="h-4 w-4 rounded bg-gray-200 shrink-0" />
                    <div className="h-3 rounded bg-gray-200 flex-1" />
                    <div className="h-4 w-12 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            )}

            {/* Predictive results (Typesense) */}
            {showPredictive && !isLoadingResults && results.length > 0 && (
              <div className="p-4 space-y-4">
                {results.map((group) => {
                  let offset = 0
                  for (const g of results) {
                    if (g.group === group.group) break
                    offset += g.items.length
                  }

                  return (
                    <div
                      key={group.group}
                      role="group"
                      aria-labelledby={`group-${group.group.replaceAll(" ", "-").toLowerCase()}`}
                    >
                      <p
                        id={`group-${group.group.replaceAll(" ", "-").toLowerCase()}`}
                        className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2"
                      >
                        {group.group}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item, i) => {
                          const globalIndex = offset + i
                          const isHighlighted = activeIndex === globalIndex
                          return (
                            <button
                              key={`result-${group.group}-${item.label}`}
                              id={`search-option-${globalIndex}`}
                              role="option"
                              aria-selected={isHighlighted}
                              data-index={globalIndex}
                              onPointerDown={(e) => {
                                e.preventDefault()
                                navigateTo(item.href)
                              }}
                              className={`
                                w-full flex items-center justify-between gap-3
                                px-3 py-2.5 rounded-lg text-left min-h-[44px]
                                transition-colors ${tSnap}
                                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c]
                                ${
                                  isHighlighted
                                    ? "bg-[#0f1e3d] text-white"
                                    : "text-[#0f1e3d] hover:bg-gray-50"
                                }
                              `}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  className="flex-shrink-0 opacity-40"
                                  aria-hidden="true"
                                >
                                  <circle cx="7" cy="7" r="4.5" />
                                  <line x1="10.5" y1="10.5" x2="13" y2="13" />
                                </svg>
                                <span className="text-sm font-medium truncate">
                                  {item.label}
                                </span>
                              </div>
                              {item.field && (
                                <span
                                  className={`
                                    text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded
                                    ${
                                      isHighlighted
                                        ? "bg-white/20 text-white/80"
                                        : "bg-gray-100 text-gray-400"
                                    }
                                  `}
                                >
                                  {item.field === "make_model"
                                    ? "model"
                                    : item.field}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* See all results footer */}
                <div className="pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    className="w-full text-left text-sm font-semibold text-[#1e3a8a] hover:underline px-3 py-2"
                    onPointerDown={(e) => {
                      e.preventDefault()
                      navigateTo(
                        `/inventory?q=${encodeURIComponent(query.trim())}`,
                      )
                    }}
                  >
                    See all results for &ldquo;{query}&rdquo; &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* No results */}
            {noResults && (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500">
                  No vehicles matching &ldquo;
                  <span className="font-medium text-[#0f1e3d]">{query}</span>
                  &rdquo;
                </p>
                <button
                  type="button"
                  className="text-sm font-semibold text-[#1e3a8a] hover:underline mt-2"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    navigateTo(
                      `/inventory?q=${encodeURIComponent(query.trim())}`,
                    )
                  }}
                >
                  Search inventory anyway &rarr;
                </button>
              </div>
            )}

            {/* Keyboard hints — desktop only */}
            {isActive && hasContent && (
              <div className="hidden md:flex items-center justify-center gap-4 px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest">
                <span>&uarr;&darr; Navigate</span>
                <span>&crarr; Select</span>
                <span>Esc Close</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default SearchAutocomplete
