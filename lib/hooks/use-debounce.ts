/**
 * lib/hooks/use-debounce.ts
 *
 * Generic debounce hook — delays updating the returned value until
 * `delay` milliseconds have elapsed since the last change.
 *
 * @example
 *   const debouncedQuery = useDebounce(query, 300)
 *   // debouncedQuery only updates 300ms after the user stops typing
 */
import { useState, useEffect } from "react"

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
