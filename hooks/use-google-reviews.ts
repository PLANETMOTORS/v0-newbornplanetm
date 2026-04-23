"use client"

import useSWR from "swr"

interface GoogleReviewsData {
  rating: number
  reviewCount: number
  lastUpdated: string
  source: "cache" | "api" | "fallback"
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

// Default fallback values
const DEFAULT_DATA: GoogleReviewsData = {
  rating: 4.8,
  reviewCount: 277,
  lastUpdated: new Date().toISOString(),
  source: "fallback"
}

export function useGoogleReviews() {
  const { data, error, isLoading, mutate } = useSWR<GoogleReviewsData>(
    "/api/google-reviews",
    fetcher,
    {
      fallbackData: DEFAULT_DATA,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 1000 * 60 * 60, // Refresh every hour
      dedupingInterval: 1000 * 60 * 5, // Dedupe requests within 5 minutes
    }
  )

  return {
    rating: data?.rating ?? DEFAULT_DATA.rating,
    reviewCount: data?.reviewCount ?? DEFAULT_DATA.reviewCount,
    lastUpdated: data?.lastUpdated,
    source: data?.source,
    isLoading,
    isError: !!error,
    refresh: mutate
  }
}
