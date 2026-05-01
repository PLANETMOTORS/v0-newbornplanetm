/**
 * lib/search/data.ts
 *
 * Server-side data layer for the search bar's "Popular Searches" feature.
 *
 * Cache strategy: Redis (Upstash) first → Supabase RPC fallback.
 * TTL: 15 minutes. Gracefully degrades when Redis is unavailable.
 */

import type { Redis } from "@upstash/redis"
import { logger } from "@/lib/logger"

// ── Types ──────────────────────────────────────────────────────────────────

export interface PopularSearch {
  readonly label: string
  readonly type: "body_style" | "fuel" | "price" | "make"
  readonly count: number
  readonly href: string
  readonly score: number
}

// ── Constants ──────────────────────────────────────────────────────────────

const POPULAR_KEY = "planet:popular_searches"
const POPULAR_TTL = 900 // 15 minutes in seconds

// ── Redis accessor ─────────────────────────────────────────────────────────

async function getRedis(): Promise<Redis | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null
  }
  try {
    const { Redis: UpstashRedis } = await import("@upstash/redis")
    return new UpstashRedis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  } catch {
    return null
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getPopularSearches(): Promise<readonly PopularSearch[]> {
  try {
    const redis = await getRedis()

    if (redis) {
      const cached = await redis.get<string>(POPULAR_KEY)
      if (typeof cached === "string") {
        return JSON.parse(cached) as PopularSearch[]
      }
    }

    const { createAdminClient } = await import("@/lib/supabase/server")
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc("get_popular_searches")

    if (error) {
      logger.error("[search/data] RPC error:", error)
      return []
    }

    const results = (data ?? []) as PopularSearch[]

    if (redis) {
      await redis.set(POPULAR_KEY, JSON.stringify(results), { ex: POPULAR_TTL })
    }

    return results
  } catch (err) {
    logger.error("[search/data] getPopularSearches failed:", err)
    return []
  }
}

export async function invalidatePopularSearchCache(): Promise<void> {
  try {
    const redis = await getRedis()
    if (redis) {
      await redis.del(POPULAR_KEY)
    }
  } catch (err) {
    logger.warn(
      "[search/data] Cache invalidation failed:",
      err instanceof Error ? err.message : String(err),
    )
  }
}
