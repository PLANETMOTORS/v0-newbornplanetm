/**
 * lib/search/data.ts
 *
 * Server-side data layer for the search bar's "Popular Searches"
 * section. Uses Upstash Redis as a cache with Supabase RPC fallback.
 *
 * Predictive type-ahead is handled by Typesense (see lib/typesense/search.ts).
 * This module only powers the dynamic, inventory-scored suggestions that
 * appear the instant a user focuses the search bar — before they type.
 */

import type { Redis } from "@upstash/redis"
import { logger } from "@/lib/logger"

// ── Types ──────────────────────────────────────────────────────────────────

export interface PopularSearch {
  label: string
  type: "body_style" | "fuel" | "price" | "make"
  count: number
  href: string
  score: number
}

// ── Redis singleton ────────────────────────────────────────────────────────

const POPULAR_KEY = "planet:popular_searches"
const POPULAR_TTL = 900 // 15 minutes

let redisClient: Redis | null = null

async function getRedis(): Promise<Redis | null> {
  if (redisClient) return redisClient

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null
  }

  try {
    const { Redis: UpstashRedis } = await import("@upstash/redis")
    redisClient = new UpstashRedis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
    return redisClient
  } catch (err) {
    logger.warn("[search/data] Redis init failed:", (err as Error).message)
    return null
  }
}

// ── Popular Searches ───────────────────────────────────────────────────────

/**
 * Fetch scored popular searches.
 * 1. Try Redis cache
 * 2. Cache miss → Supabase RPC `get_popular_searches()`
 * 3. Write result to Redis with 15-min TTL
 *
 * Gracefully returns [] when Redis or Supabase are unavailable.
 */
export async function getPopularSearches(): Promise<PopularSearch[]> {
  try {
    // 1. Try Redis cache
    const redis = await getRedis()
    if (redis) {
      const cached = await redis.get<string>(POPULAR_KEY)
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : (cached as unknown as PopularSearch[])
      }
    }

    // 2. Cache miss — hit Supabase RPC
    const { createAdminClient } = await import("@/lib/supabase/server")
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc("get_popular_searches")

    if (error) {
      logger.error("[search/data] get_popular_searches RPC error:", error)
      return []
    }

    const results = (data ?? []) as PopularSearch[]

    // 3. Write to Redis
    if (redis) {
      await redis.set(POPULAR_KEY, JSON.stringify(results), { ex: POPULAR_TTL })
    }

    return results
  } catch (err) {
    logger.error("[search/data] getPopularSearches failed:", err)
    return []
  }
}

// ── Cache Invalidation ─────────────────────────────────────────────────────

/**
 * Invalidate the popular-searches cache. Call this from the HomeNet
 * inventory webhook handler when vehicles are added/sold/updated.
 */
export async function invalidatePopularSearchCache(): Promise<void> {
  try {
    const redis = await getRedis()
    if (redis) {
      await redis.del(POPULAR_KEY)
    }
  } catch (err) {
    logger.warn("[search/data] Cache invalidation failed:", (err as Error).message)
  }
}
