"use client"

/**
 * components/search-autocomplete.tsx
 *
 * Real-time typo-tolerant search autocomplete powered by Typesense.
 *
 * Features:
 *  - Calls /api/search/suggestions (→ getSmartSuggestions) for live suggestions
 *  - Falls back to /api/search for full vehicle results when no suggestions match
 *  - Keyboard navigation: ↑ ↓ Enter Escape
 *  - 300 ms debounce + AbortController to cancel stale requests
 *  - Loading spinner while fetching
 *  - Popular / Recent searches shown when input is empty
 *  - Field-type badge (make / model / trim) on each suggestion
 */

import { useState, useRef, useEffect, useCallback, useId } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Clock, Car, Loader2, Tag, Layers } from "lucide-react"
import Link from "next/link"
import type { SmartSuggestion } from "@/lib/typesense/search"

// ── Static data ────────────────────────────────────────────────────────────

const POPULAR_SEARCHES = [
  "Tesla Model 3",
  "BMW X5",
  "Mercedes GLE",
  "Toyota RAV4",
  "Honda CR-V",
]

const RECENT_SEARCHES_KEY = "pm_recent_searches"
const MAX_RECENT = 5

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined") return
  try {
    const existing = loadRecentSearches().filter((s) => s !== query)
    const updated = [query, ...existing].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

// ── Field icon helper ──────────────────────────────────────────────────────

function FieldIcon({ field }: { field: SmartSuggestion["field"] }) {
  switch (field) {
    case "make":
      return <Car className="h-4 w-4 text-muted-foreground" />
    case "make_model":
      return <Layers className="h-4 w-4 text-muted-foreground" />
    case "trim":
      return <Tag className="h-4 w-4 text-muted-foreground" />
    default:
      return <Search className="h-4 w-4 text-muted-foreground" />
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function SearchAutocomplete() {
  const listboxId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load recent searches from localStorage on mount
  useEffect(() => {
    setRecentSearches(loadRecentSearches())
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch suggestions from /api/search/suggestions (Typesense Smart Suggestions)
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()

    if (q.trim().length < 2) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(q.trim())}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error("suggestions fetch failed")
        const data = (await res.json()) as { suggestions: SmartSuggestion[] }
        setSuggestions(data.suggestions ?? [])
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setSuggestions([])
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }, 300)
  }, [])

  useEffect(() => {
    fetchSuggestions(query)
    setActiveIndex(-1)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [query, fetchSuggestions])

  // Navigate to inventory with the selected query
  const handleSelect = useCallback(
    (selectedQuery: string) => {
      setQuery(selectedQuery)
      setIsOpen(false)
      setActiveIndex(-1)
      saveRecentSearch(selectedQuery)
      setRecentSearches(loadRecentSearches())
      // Navigate to inventory search results
      window.location.href = `/inventory?q=${encodeURIComponent(selectedQuery)}`
    },
    []
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return

      const itemCount = suggestions.length

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setActiveIndex((prev) => (prev < itemCount - 1 ? prev + 1 : 0))
          break
        case "ArrowUp":
          e.preventDefault()
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : itemCount - 1))
          break
        case "Enter":
          e.preventDefault()
          if (activeIndex >= 0 && suggestions[activeIndex]) {
            handleSelect(suggestions[activeIndex].query)
          } else if (query.trim().length >= 2) {
            handleSelect(query.trim())
          }
          break
        case "Escape":
          setIsOpen(false)
          setActiveIndex(-1)
          inputRef.current?.blur()
          break
      }
    },
    [isOpen, suggestions, activeIndex, query, handleSelect]
  )

  const showDropdown = isOpen
  const showEmpty = isOpen && query.trim().length >= 2 && !isLoading && suggestions.length === 0

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
        <Input
          ref={inputRef}
          data-testid="typesense-search-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          placeholder="Search by make, model, or keyword..."
          className="pl-10 pr-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          data-testid="search-results-dropdown"
          aria-label="Search suggestions"
          className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 overflow-hidden"
        >
          {/* Empty state — show popular / recent */}
          {query.trim().length < 2 ? (
            <div className="p-4">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <Badge
                        key={search}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80"
                        onClick={() => setQuery(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <TrendingUp className="h-3 w-3" />
                  Popular Searches
                </div>
                <div className="space-y-1">
                  {POPULAR_SEARCHES.map((search) => (
                    <button
                      key={search}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center gap-2"
                      onClick={() => setQuery(search)}
                    >
                      <Search className="h-3 w-3 text-muted-foreground" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : isLoading ? (
            /* Loading skeleton */
            <div className="py-3 px-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            /* Smart Suggestions from Typesense */
            <div className="py-2" aria-live="polite">
              <div className="px-4 py-1 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.field}-${suggestion.query}`}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  data-testid="search-result-item"
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors ${
                    activeIndex === index ? "bg-muted" : ""
                  }`}
                  onClick={() => handleSelect(suggestion.query)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="w-8 h-8 rounded bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <FieldIcon field={suggestion.field} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{suggestion.label}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                    {suggestion.field === "make_model" ? "model" : suggestion.field}
                  </Badge>
                </button>
              ))}
              {/* See all results link */}
              <div className="px-4 py-2 border-t mt-1">
                <Link
                  href={`/inventory?q=${encodeURIComponent(query)}`}
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    setIsOpen(false)
                    saveRecentSearch(query.trim())
                    setRecentSearches(loadRecentSearches())
                  }}
                >
                  See all results for &quot;{query}&quot; →
                </Link>
              </div>
            </div>
          ) : showEmpty ? (
            /* No results */
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No suggestions for &quot;{query}&quot;
              </p>
              <Link
                href={`/inventory?q=${encodeURIComponent(query)}`}
                className="text-sm text-primary hover:underline mt-1 inline-block"
                onClick={() => setIsOpen(false)}
              >
                Search inventory anyway →
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
