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
  CommandInput,
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
  const cls = "h-3.5 w-3.5 text-pm-brand/60 shrink-0"
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
      {/* Anchor — the input sits here so the popover aligns to it */}
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <Command
            shouldFilter={false}
            className="rounded-lg border border-pm-border bg-white shadow-none overflow-visible"
          >
            <CommandInput
              ref={inputRef}
              data-testid="typesense-search-input"
              placeholder="Search make, model, keyword…"
              value={query}
              onValueChange={(v) => {
                setQuery(v)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              className="text-sm h-9"
              aria-expanded={open}
              aria-controls="search-results-list"
            />
            {/* Inline loading spinner inside the input row */}
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-pm-brand/50 pointer-events-none" />
            )}
          </Command>
        </div>
      </PopoverAnchor>

      <PopoverContent
        data-testid="search-results-dropdown"
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[320px] rounded-xl border border-pm-border shadow-xl overflow-hidden"
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} className="rounded-none border-0 shadow-none">
          <CommandList id="search-results-list" className="max-h-[420px]">

            {/* ── Empty query: show recent + popular ── */}
            {query.trim().length < 2 && (
              <>
                {recent.length > 0 && (
                  <CommandGroup
                    heading={
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-pm-text-muted">
                        <Clock className="h-3 w-3" /> Recent
                      </span>
                    }
                  >
                    {recent.map((s) => (
                      <CommandItem
                        key={s}
                        value={s}
                        onSelect={() => navigate(s)}
                        className="cursor-pointer text-sm text-pm-text-secondary hover:text-pm-brand hover:bg-pm-brand-light"
                      >
                        <Clock className="h-3.5 w-3.5 text-pm-text-muted shrink-0" />
                        {s}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {recent.length > 0 && <CommandSeparator />}

                <CommandGroup
                  heading={
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-pm-text-muted">
                      <TrendingUp className="h-3 w-3" /> Popular
                    </span>
                  }
                >
                  {POPULAR_SEARCHES.map((s) => (
                    <CommandItem
                      key={s}
                      value={s}
                      onSelect={() => navigate(s)}
                      className="cursor-pointer text-sm text-pm-text-secondary hover:text-pm-brand hover:bg-pm-brand-light"
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-pm-text-muted shrink-0" />
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
                    <div className="h-4 w-4 rounded bg-pm-border shrink-0" />
                    <div className="h-3 rounded bg-pm-border flex-1" />
                    <div className="h-4 w-12 rounded bg-pm-surface-light" />
                  </div>
                ))}
              </CommandGroup>
            )}

            {/* ── Typesense suggestions ── */}
            {!isLoading && suggestions.length > 0 && (
              <CommandGroup
                heading={
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-pm-brand/60">
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
                    className="cursor-pointer group hover:bg-pm-brand-light"
                  >
                    <FieldIcon field={s.field} />
                    <span className="flex-1 text-sm text-pm-text-primary group-hover:text-pm-brand truncate">
                      {s.label}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize border-pm-border text-pm-text-muted group-hover:border-pm-brand/20 group-hover:text-pm-brand/60"
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
                <p className="text-sm text-pm-text-secondary mb-2">
                  No suggestions for &ldquo;{debouncedQuery}&rdquo;
                </p>
                <button
                  className="text-sm font-semibold text-pm-brand hover:underline"
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
                    className="w-full text-left text-sm font-semibold text-pm-brand hover:underline"
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
