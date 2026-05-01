/**
 * lib/hooks/use-debounced-fetch.ts
 *
 * Generic hook: debounces a query string, fetches via a caller-supplied
 * function, and handles AbortController lifecycle automatically.
 *
 * - Aborts in-flight requests on query change and component unmount.
 * - Returns null (no fetch yet), an empty array (no results), or data.
 */

import { useEffect, useRef, useState } from "react"

export interface UseDebouncedFetchOptions<T> {
  readonly query: string
  readonly minLength: number
  readonly delayMs: number
  readonly fetcher: (q: string, signal: AbortSignal) => Promise<T | null>
  readonly enabled?: boolean
}

export function useDebouncedFetch<T>({
  query,
  minLength,
  delayMs,
  fetcher,
  enabled = true,
}: UseDebouncedFetchOptions<T>): {
  data: T | null
  isLoading: boolean
} {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!enabled || query.length < minLength) {
      setData(null)
      setIsLoading(false)
      abortRef.current?.abort()
      return
    }

    setIsLoading(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timer = globalThis.setTimeout(async () => {
      const result = await fetcher(query, controller.signal)
      if (!controller.signal.aborted) {
        setData(result)
        setIsLoading(false)
      }
    }, delayMs)

    return () => {
      globalThis.clearTimeout(timer)
      controller.abort()
    }
  }, [query, minLength, delayMs, fetcher, enabled])

  return { data, isLoading }
}
