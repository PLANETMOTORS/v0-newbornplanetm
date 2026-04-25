"use client"

/**
 * components/search-autocomplete.tsx
 *
 * Planet Motors — Typesense-powered search command palette.
 *
 * Built on top of the existing cmdk-based <Command> primitives in
 * components/ui/command.tsx. Uses a Popover so it stays anchored to
 * the header search input without a full-screen modal overlay.
 *
 * Features
 * ─────────
 * • useDebounce (300 ms) — no API hammering on every keystroke
 * • getSmartSuggestions via /api/search/suggestions (server-side Typesense)
 * • Keyboard navigation handled natively by cmdk (↑ ↓ Enter Escape)
 * • Full ARIA combobox semantics via cmdk
 * • Loading skeleton while fetching
 * • Recent searches persisted in localStorage (max 5)
 * • Popular searches shown when input is empty
 * • Planet Motors blue (#1e3a8a) accent colour throughout
 * • Graceful degradation when Typesense is unconfigured
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Car, Layers, Tag, TrendingUp, Clock, Loader2 } from "lucide-react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import type { SmartSuggestion } from "@/lib/typesense/search"

// ── Constants ──────────────────────────────────────────────────────────────

const POPULAR_SEARCHES = [
  "Tesla Model 3",
  "BMW X5",
  "Mercedes GLE",
  "Toyota RAV4",
  "Honda CR-V",
]

const RECENT_KEY = "pm_recent_searches"
const MAX_RECENT = 5

// ── localStorage helpers ───────────────────────────────────────────────────

function loadRecent(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveRecent(q: string) {
  if (typeof window === "undefined") return
  try {
    const next = [q, ...loadRecent().filter((s) => s !== q)].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

// ── Field icon ─────────────────────────────────────────────────────────────

function FieldIcon({ field }: { field: SmartSuggestion["field"] }) {
  const cls = "h-3.5 w-3.5 text-[#1e3a8a]/60 shrink-0"
  switch (field) {
    case "make":       return <Car     className={cls} />
    case "make_model": return <Layers  className={cls} />
    case "trim":       return <Tag     className={cls} />
    default:           return <Car     className={cls} />
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function SearchAutocomplete() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen]               = useState(false)
  const [query, setQuery]             = useState("")
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [isLoading, setIsLoading]     = useState(false)
  const [recent, setRecent]           = useState<string[]>([])

  const debouncedQuery = useDebounce(query, 300)

  // Load recent searches on mount
  useEffect(() => { setRecent(loadRecent()) }, [])

  // Abort controller ref for cancelling stale fetches
  const abortRef = useRef<AbortController | null>(null)

  // Fetch suggestions whenever debouncedQuery changes
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort()

    if (debouncedQuery.trim().length < 2) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)

    fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery.trim())}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { suggestions: [] }))
      .then((data: { suggestions: SmartSuggestion[] }) => {
        if (!controller.signal.aborted) {
          setSuggestions(data.suggestions ?? [])
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSuggestions([])
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [debouncedQuery])

  const navigate = useCallback(
    (q: string) => {
      saveRecent(q)
      setRecent(loadRecent())
      setOpen(false)
      setQuery("")
      router.push(`/inventory?q=${encodeURIComponent(q)}`)
    },
    [router]
  )

  const showEmpty = !isLoading && debouncedQuery.trim().length >= 2 && suggestions.length === 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Anchor — plain input so cmdk never sets aria-controls to a non-existent list.
           cmdk's CommandInput internally wires aria-controls={listId} which fails axe
           when the CommandList lives in a separate Popover Command context. */}
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3 h-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0 text-gray-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-label="Search vehicles by make, model, or keyword"
              data-testid="typesense-search-input"
              placeholder="Search make, model, keyword…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 h-9"
              aria-controls="search-results-listbox"
            />
            {isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1e3a8a]/50 pointer-events-none" />
            )}
          </div>
        </div>
      </PopoverAnchor>

      <PopoverContent
        data-testid="search-results-dropdown"
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[320px] rounded-xl border border-gray-200 shadow-xl overflow-hidden"
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} className="rounded-none border-0 shadow-none">
          <CommandList id="search-results-listbox" role="listbox" className="max-h-[420px]">

            {/* ── Empty query: show recent + popular ── */}
            {query.trim().length < 2 && (
              <>
                {recent.length > 0 && (
                  <CommandGroup
                    heading={
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        <Clock className="h-3 w-3" /> Recent
                      </span>
                    }
                  >
                    {recent.map((s) => (
                      <CommandItem
                        key={s}
                        value={s}
                        onSelect={() => navigate(s)}
                        className="cursor-pointer text-sm text-gray-700 hover:text-[#1e3a8a] hover:bg-[#f0f4ff]"
                      >
                        <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {s}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {recent.length > 0 && <CommandSeparator />}

                <CommandGroup
                  heading={
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      <TrendingUp className="h-3 w-3" /> Popular
                    </span>
                  }
                >
                  {POPULAR_SEARCHES.map((s) => (
                    <CommandItem
                      key={s}
                      value={s}
                      onSelect={() => navigate(s)}
                      className="cursor-pointer text-sm text-gray-700 hover:text-[#1e3a8a] hover:bg-[#f0f4ff]"
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      {s}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* ── Loading skeleton ── */}
            {isLoading && query.trim().length >= 2 && (
              <CommandGroup heading="Suggestions">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2 animate-pulse">
                    <div className="h-4 w-4 rounded bg-gray-200 shrink-0" />
                    <div className="h-3 rounded bg-gray-200 flex-1" />
                    <div className="h-4 w-12 rounded bg-gray-100" />
                  </div>
                ))}
              </CommandGroup>
            )}

            {/* ── Typesense suggestions ── */}
            {!isLoading && suggestions.length > 0 && (
              <CommandGroup
                heading={
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#1e3a8a]/60">
                    Suggestions
                  </span>
                }
              >
                {suggestions.map((s) => (
                  <CommandItem
                    key={`${s.field}-${s.query}`}
                    value={s.query}
                    data-testid="search-result-item"
                    onSelect={() => navigate(s.query)}
                    className="cursor-pointer group hover:bg-[#f0f4ff]"
                  >
                    <FieldIcon field={s.field} />
                    <span className="flex-1 text-sm text-gray-800 group-hover:text-[#1e3a8a] truncate">
                      {s.label}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize border-gray-200 text-gray-400 group-hover:border-[#1e3a8a]/20 group-hover:text-[#1e3a8a]/60"
                    >
                      {s.field === "make_model" ? "model" : s.field}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* ── No results ── */}
            {showEmpty && (
              <CommandEmpty className="py-8 text-center">
                <p className="text-sm text-gray-500 mb-2">
                  No suggestions for &ldquo;{debouncedQuery}&rdquo;
                </p>
                <button
                  className="text-sm font-semibold text-[#1e3a8a] hover:underline"
                  onClick={() => navigate(debouncedQuery.trim())}
                >
                  Search inventory anyway →
                </button>
              </CommandEmpty>
            )}

            {/* ── See all results footer ── */}
            {!isLoading && suggestions.length > 0 && (
              <>
                <CommandSeparator />
                <div className="px-3 py-2.5">
                  <button
                    className="w-full text-left text-sm font-semibold text-[#1e3a8a] hover:underline"
                    onClick={() => navigate(query.trim())}
                  >
                    See all results for &ldquo;{query}&rdquo; →
                  </button>
                </div>
              </>
            )}

          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
