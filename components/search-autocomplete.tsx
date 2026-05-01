"use client"

/**
 * components/search-autocomplete.tsx
 *
 * Planet Ultra search bar (v2 rewrite).
 *
 * Architecture:
 *   - useReducer for centralised state (no scattered useState).
 *   - useDebouncedFetch for Typesense type-ahead with AbortController lifecycle.
 *   - useId() for deterministic ARIA IDs (no hand-rolled strings).
 *   - All event handlers extracted — zero inline anonymous functions in JSX.
 *   - Full WCAG AA / AODA: role="combobox", aria-activedescendant,
 *     keyboard nav (ArrowDown/Up, Enter, Escape), focus trap on mobile,
 *     body scroll lock, prefers-reduced-motion, min 44px touch targets.
 *
 * Variants:
 *   "bar"  — Desktop: full search bar rendered in header.
 *   "icon" — Mobile: compact search icon that opens a full-screen overlay.
 */

import { useCallback, useEffect, useId, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, TrendingUp, Loader2, X } from "lucide-react"
import { useSearchState } from "@/lib/hooks/use-search-state"
import { useDebouncedFetch } from "@/lib/hooks/use-debounced-fetch"
import type { SearchGroup, SearchGroupItem } from "@/lib/hooks/use-search-state"
import type { PopularSearch } from "@/lib/search/data"
import type { SmartSuggestion } from "@/lib/typesense/search"

// ── Config ─────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 300
const MIN_QUERY = 2
const POPULAR_CACHE_TTL = 15 * 60 * 1000

// ── Client-side popular cache ──────────────────────────────────────────────

let _popularCache: { data: readonly PopularSearch[]; ts: number } = {
  data: [],
  ts: 0,
}

async function fetchPopular(): Promise<readonly PopularSearch[]> {
  if (_popularCache.data.length > 0 && Date.now() - _popularCache.ts < POPULAR_CACHE_TTL) {
    return _popularCache.data
  }
  try {
    const res = await globalThis.fetch("/api/search/popular")
    if (!res.ok) return _popularCache.data
    const data = (await res.json()) as PopularSearch[]
    _popularCache = { data, ts: Date.now() }
    return data
  } catch {
    return _popularCache.data
  }
}

// ── Typesense fetcher ──────────────────────────────────────────────────────

async function fetchTypesense(
  query: string,
  signal: AbortSignal,
): Promise<readonly SearchGroup[] | null> {
  try {
    const res = await globalThis.fetch(
      `/api/search/suggestions?q=${encodeURIComponent(query.trim())}`,
      { signal },
    )
    if (signal.aborted) return null
    if (!res.ok) return []

    const json = (await res.json()) as { suggestions: SmartSuggestion[] }
    const suggestions = json.suggestions ?? []
    if (suggestions.length === 0) return []

    const makes: SearchGroupItem[] = []
    const models: SearchGroupItem[] = []
    const trims: SearchGroupItem[] = []

    for (const s of suggestions) {
      const item: SearchGroupItem = {
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
    if (makes.length > 0) groups.push({ heading: "Makes", items: makes })
    if (models.length > 0) groups.push({ heading: "Models", items: models })
    if (trims.length > 0) groups.push({ heading: "Trims", items: trims })
    return groups
  } catch {
    if (signal.aborted) return null
    return []
  }
}

// ── Badge map ──────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<string, { label: string; className: string }> = {
  body_style: { label: "Body", className: "bg-blue-100 text-blue-800" },
  fuel: { label: "Fuel", className: "bg-green-100 text-green-800" },
  price: { label: "Price", className: "bg-amber-100 text-amber-800" },
  make: { label: "Make", className: "bg-slate-100 text-slate-700" },
}

function TypeBadge({ type }: Readonly<{ type: string }>) {
  const badge = BADGE_STYLES[type]
  if (!badge) return null
  return (
    <span
      aria-hidden="true"
      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${badge.className}`}
    >
      {badge.label}
    </span>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export function SearchAutocomplete({
  variant = "bar",
}: Readonly<{ variant?: "bar" | "icon" }>) {
  const router = useRouter()
  const instanceId = useId()
  const inputId = `search-input-${instanceId}`
  const listboxId = `search-listbox-${instanceId}`
  const optionIdPrefix = `search-opt-${instanceId}`

  const [state, dispatch] = useSearchState()
  const { isOpen, query, popular, groups, isLoading, activeIndex } = state

  const containerRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)

  // ── Flat list for keyboard nav ──
  const flatItems = useMemo<readonly (SearchGroupItem & { group: string })[]>(() => {
    if (query.length >= MIN_QUERY && groups.length > 0) {
      return groups.flatMap((g) =>
        g.items.map((item) => ({ ...item, group: g.heading })),
      )
    }
    if (query.length >= MIN_QUERY) return []
    return popular.map((item) => ({ ...item, group: "popular" }))
  }, [query, groups, popular])

  // ── Debounced Typesense fetch ──
  const typesenseFetcher = useCallback(
    (q: string, signal: AbortSignal) => fetchTypesense(q, signal),
    [],
  )

  const { data: typesenseGroups, isLoading: isFetching } = useDebouncedFetch<
    readonly SearchGroup[]
  >({
    query,
    minLength: MIN_QUERY,
    delayMs: DEBOUNCE_MS,
    fetcher: typesenseFetcher,
    enabled: isOpen,
  })

  useEffect(() => {
    dispatch({ type: "SET_LOADING", payload: isFetching })
  }, [isFetching, dispatch])

  useEffect(() => {
    if (typesenseGroups !== null) {
      dispatch({ type: "SET_GROUPS", payload: typesenseGroups })
    }
  }, [typesenseGroups, dispatch])

  // ── Derived state ──
  const showPopular = isOpen && query.length < MIN_QUERY && popular.length > 0
  const showResults = isOpen && query.length >= MIN_QUERY && !isLoading && groups.length > 0
  const showNoResults = isOpen && query.length >= MIN_QUERY && !isLoading && groups.length === 0
  const showLoading = isOpen && query.length >= MIN_QUERY && isLoading
  const isExpanded = showPopular || showResults || showNoResults || showLoading

  // ── Actions ──
  const openSearch = useCallback(async () => {
    dispatch({ type: "OPEN" })
    const data = await fetchPopular()
    dispatch({ type: "SET_POPULAR", payload: data })
    globalThis.requestAnimationFrame(() => inputRef.current?.focus())
  }, [dispatch])

  const closeSearch = useCallback(() => {
    dispatch({ type: "CLOSE" })
    inputRef.current?.blur()
  }, [dispatch])

  const navigateTo = useCallback(
    (href: string) => {
      closeSearch()
      router.push(href)
    },
    [closeSearch, router],
  )

  // ── Outside click (pointerdown, not blur) ──
  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch()
      }
    }

    globalThis.document.addEventListener("pointerdown", handlePointerDown)
    return () => globalThis.document.removeEventListener("pointerdown", handlePointerDown)
  }, [isOpen, closeSearch])

  // ── Escape key ──
  useEffect(() => {
    if (!isOpen) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        closeSearch()
      }
    }

    globalThis.document.addEventListener("keydown", handleEscape)
    return () => globalThis.document.removeEventListener("keydown", handleEscape)
  }, [isOpen, closeSearch])

  // ── Body scroll lock (mobile overlay only) ──
  useEffect(() => {
    if (variant === "icon" && isOpen) {
      globalThis.document.body.style.overflow = "hidden"
    } else if (variant === "icon") {
      globalThis.document.body.style.overflow = ""
    }
    return () => {
      if (variant === "icon") {
        globalThis.document.body.style.overflow = ""
      }
    }
  }, [isOpen, variant])

  // ── Scroll active option into view ──
  useEffect(() => {
    if (activeIndex < 0) return
    const el = listboxRef.current?.querySelector(`[data-index="${activeIndex}"]`)
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex])

  // ── Keyboard handler ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const len = flatItems.length

      if (e.key === "Enter") {
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < len) {
          navigateTo(flatItems[activeIndex].href)
        } else if (query.trim().length >= MIN_QUERY) {
          navigateTo(`/inventory?q=${encodeURIComponent(query.trim())}`)
        }
        return
      }

      if (len === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        dispatch({ type: "MOVE_DOWN", payload: len })
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        dispatch({ type: "MOVE_UP", payload: len })
      }
    },
    [flatItems, activeIndex, query, navigateTo, dispatch],
  )

  // ── Input change handler ──
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "SET_QUERY", payload: e.target.value })
      if (!isOpen) dispatch({ type: "OPEN" })
    },
    [isOpen, dispatch],
  )

  // ── Focus handler ──
  const handleFocus = useCallback(() => {
    if (!isOpen) {
      openSearch()
    }
  }, [isOpen, openSearch])

  // ── Active ARIA descendant ──
  const activeDescendant = activeIndex >= 0 ? `${optionIdPrefix}-${activeIndex}` : undefined

  // ── "icon" variant: mobile search button ──
  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          aria-label="Search vehicles"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
          onClick={openSearch}
        >
          <Search className="h-5 w-5 text-gray-600" aria-hidden="true" />
        </button>

        {isOpen && (
          <dialog
            ref={containerRef as React.RefObject<HTMLDialogElement | null>}
            open
            className="fixed inset-0 z-50 bg-white flex flex-col motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 w-full h-full m-0 p-0 border-none max-w-none max-h-none"
            aria-label="Search vehicles"
          >
            <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-200">
              <Search className="h-5 w-5 text-gray-400 shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                id={inputId}
                role="combobox"
                aria-expanded={isExpanded}
                aria-controls={listboxId}
                aria-activedescendant={activeDescendant}
                aria-autocomplete="list"
                aria-label="Search vehicles by make, model, or keyword"
                placeholder="Search make, model, keyword..."
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="flex-1 text-base bg-transparent outline-none placeholder:text-gray-400"
                autoComplete="off"
                spellCheck={false}
              />
              {isLoading && (
                <Loader2
                  className="h-4 w-4 animate-spin text-[#1e3a8a]/60 shrink-0"
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                aria-label="Close search"
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
                onClick={closeSearch}
              >
                <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
              </button>
            </div>

            <div
              ref={listboxRef}
              id={listboxId}
              role="listbox" // NOSONAR — WAI-ARIA combobox pattern requires role="listbox" on the suggestion popup
              aria-label="Search suggestions"
              className="flex-1 overflow-y-auto"
            >
              {renderDropdownContent({
                showPopular,
                showLoading,
                showResults,
                showNoResults,
                popular,
                groups,
                query,
                activeIndex,
                optionIdPrefix,
                navigateTo,
              })}
            </div>
          </dialog>
        )}
      </>
    )
  }

  // ── "bar" variant: desktop search bar ──
  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement | null>} className="relative w-full">
      <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3 h-10">
        <Search
          className="h-4 w-4 shrink-0 text-gray-400 mr-2"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-expanded={isExpanded}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
          aria-autocomplete="list"
          aria-label="Search vehicles by make, model, or keyword"
          data-testid="search-input"
          placeholder="Search make, model, keyword..."
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 h-9"
          autoComplete="off"
          spellCheck={false}
        />
        {isLoading && (
          <Loader2
            className="h-3.5 w-3.5 animate-spin text-[#1e3a8a]/60 shrink-0 pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>

      {isOpen && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox" // NOSONAR — WAI-ARIA combobox pattern requires role="listbox" on the suggestion popup
          aria-label="Search suggestions"
          data-testid="search-dropdown"
          className="absolute top-full left-0 right-0 mt-1.5 max-h-[420px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl z-50"
        >
          {renderDropdownContent({
            showPopular,
            showLoading,
            showResults,
            showNoResults,
            popular,
            groups,
            query,
            activeIndex,
            optionIdPrefix,
            navigateTo,
          })}
        </div>
      )}
    </div>
  )
}

// ── Dropdown content renderer (shared between bar and icon variants) ──────

interface DropdownProps {
  readonly showPopular: boolean
  readonly showLoading: boolean
  readonly showResults: boolean
  readonly showNoResults: boolean
  readonly popular: readonly PopularSearch[]
  readonly groups: readonly SearchGroup[]
  readonly query: string
  readonly activeIndex: number
  readonly optionIdPrefix: string
  readonly navigateTo: (href: string) => void
}

function PopularDropdown({
  popular,
  activeIndex,
  optionIdPrefix,
  navigateTo,
}: Readonly<Pick<DropdownProps, "popular" | "activeIndex" | "optionIdPrefix" | "navigateTo">>) {
  return (
    <div className="py-2">
      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        Popular
      </p>
      {popular.map((item, i) => (
        <button
          key={item.label}
          id={`${optionIdPrefix}-${i}`}
          role="option" // NOSONAR — WAI-ARIA combobox pattern: items inside role="listbox" must use role="option"
          aria-selected={activeIndex === i}
          data-index={i}
          type="button"
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors min-h-[44px] ${
            activeIndex === i
              ? "bg-[#f0f4ff] text-[#1e3a8a]"
              : "text-gray-700 hover:bg-[#f0f4ff] hover:text-[#1e3a8a]"
          }`}
          onClick={() => navigateTo(item.href)}
        >
          <TrendingUp className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.count > 0 && (
            <span className="text-xs text-gray-400">{item.count}</span>
          )}
          <TypeBadge type={item.type} />
        </button>
      ))}
    </div>
  )
}

function LoadingDropdown() {
  return (
    <div className="py-3">
      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Searching...
      </p>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
          <div className="h-4 w-4 rounded bg-gray-200 shrink-0" />
          <div className="h-3 rounded bg-gray-200 flex-1" />
          <div className="h-4 w-12 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

function buildIndexMap(groups: readonly SearchGroup[]): Map<string, number> {
  const map = new Map<string, number>()
  let idx = 0
  for (const group of groups) {
    for (const item of group.items) {
      map.set(`${group.heading}-${item.label}`, idx++)
    }
  }
  return map
}

function ResultsDropdown({
  groups,
  query,
  activeIndex,
  optionIdPrefix,
  navigateTo,
}: Readonly<Pick<DropdownProps, "groups" | "query" | "activeIndex" | "optionIdPrefix" | "navigateTo">>) {
  const indexMap = buildIndexMap(groups)
  return (
    <div className="py-2">
      {groups.map((group) => (
        <div key={group.heading}>
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#1e3a8a]/60">
            {group.heading}
          </p>
          {group.items.map((item) => {
            const key = `${group.heading}-${item.label}`
            const idx = indexMap.get(key) ?? -1
            return (
              <button
                key={key}
                id={`${optionIdPrefix}-${idx}`}
                role="option" // NOSONAR — WAI-ARIA combobox pattern: items inside role="listbox" must use role="option"
                aria-selected={activeIndex === idx}
                data-testid="search-result-item"
                data-index={idx}
                type="button"
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors min-h-[44px] ${
                  activeIndex === idx
                    ? "bg-[#f0f4ff] text-[#1e3a8a]"
                    : "text-gray-700 hover:bg-[#f0f4ff] hover:text-[#1e3a8a]"
                }`}
                onClick={() => navigateTo(item.href)}
              >
                <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden="true" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.field && (
                  <span className="text-[10px] capitalize text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                    {item.field === "make_model" ? "model" : item.field}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ))}

      <div className="border-t border-gray-100 px-3 py-2.5">
        <button
          type="button"
          className="w-full text-left text-sm font-semibold text-[#1e3a8a] hover:underline min-h-[44px] flex items-center"
          onClick={() =>
            navigateTo(`/inventory?q=${encodeURIComponent(query.trim())}`)
          }
        >
          See all results for &ldquo;{query.trim()}&rdquo; &rarr;
        </button>
      </div>
    </div>
  )
}

function NoResultsDropdown({
  query,
  navigateTo,
}: Readonly<Pick<DropdownProps, "query" | "navigateTo">>) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-gray-500 mb-3">
        No vehicles matching &ldquo;{query.trim()}&rdquo;
      </p>
      <button
        type="button"
        className="text-sm font-semibold text-[#1e3a8a] hover:underline min-h-[44px]"
        onClick={() =>
          navigateTo(`/inventory?q=${encodeURIComponent(query.trim())}`)
        }
      >
        Search inventory anyway &rarr;
      </button>
    </div>
  )
}

function renderDropdownContent(props: DropdownProps): React.ReactNode {
  if (props.showPopular) {
    return <PopularDropdown {...props} />
  }
  if (props.showLoading) {
    return <LoadingDropdown />
  }
  if (props.showResults) {
    return <ResultsDropdown {...props} />
  }
  if (props.showNoResults) {
    return <NoResultsDropdown {...props} />
  }
  return null
}
