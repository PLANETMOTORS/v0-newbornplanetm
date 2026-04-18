"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Clock, Car } from "lucide-react"
import Link from "next/link"

interface SearchResult {
  id: string
  type: "vehicle" | "make" | "model" | "category"
  title: string
  subtitle?: string
  url: string
}

const popularSearches = [
  "Tesla Model 3",
  "BMW X5",
  "Mercedes GLE",
  "Toyota RAV4",
  "Honda CR-V"
]

const recentSearches = [
  "Electric SUV",
  "Under $40,000"
]

// Sample search results - in production this would come from an API
const sampleResults: SearchResult[] = [
  { id: "1", type: "vehicle", title: "2024 Tesla Model 3 Long Range", subtitle: "$52,990 • 12,500 km", url: "/vehicles/1" },
  { id: "2", type: "vehicle", title: "2023 BMW X5 xDrive40i", subtitle: "$72,995 • 15,200 km", url: "/vehicles/2" },
  { id: "3", type: "make", title: "Tesla", subtitle: "12 vehicles available", url: "/vehicles?make=tesla" },
  { id: "4", type: "category", title: "Electric Vehicles", subtitle: "28 vehicles available", url: "/vehicles?fuel=electric" },
  { id: "5", type: "model", title: "Model 3", subtitle: "Tesla", url: "/vehicles?make=tesla&model=model-3" },
]

export function SearchAutocomplete() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search — waits 300ms after last keystroke before firing API call
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const debouncedSearch = useCallback((q: string) => {
    // Clear previous debounce timer
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // Abort previous in-flight request
    if (abortRef.current) abortRef.current.abort()

    if (q.length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController()
      abortRef.current = controller
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.results?.length) {
            setResults(data.results as SearchResult[])
          } else {
            const filtered = sampleResults.filter(r =>
              r.title.toLowerCase().includes(q.toLowerCase())
            )
            setResults(filtered)
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            const filtered = sampleResults.filter(r =>
              r.title.toLowerCase().includes(q.toLowerCase())
            )
            setResults(filtered)
          }
        })
    }, 300)
  }, [])

  useEffect(() => {
    debouncedSearch(query)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [query, debouncedSearch])

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="typesense-search-input"
          placeholder="Search by make, model, or keyword..."
          className="pl-10 pr-4"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div data-testid="search-results-dropdown" aria-live="polite" className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          {query.length < 2 ? (
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
                  {popularSearches.map((search) => (
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
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={result.url}
                  data-testid="search-result-item"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {result.type}
                  </Badge>
                </Link>
              ))}
              <div className="px-4 py-2 border-t">
                <Link
                  href={`/inventory?q=${encodeURIComponent(query)}`}
                  className="text-sm text-primary hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  See all results for &quot;{query}&quot;
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
