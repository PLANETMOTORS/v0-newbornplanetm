import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import { logger } from "@/lib/logger"

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

const CACHE_KEY = "google_reviews_data"
const CACHE_TTL = 3600 // 1 hour in seconds

interface GoogleReviewsData {
  rating: number
  reviewCount: number
  lastUpdated: string
}

export async function GET() {
  const redis = getRedis()
  try {
    // Check cache first
    const cachedData = redis ? await redis.get<GoogleReviewsData>(CACHE_KEY) : null
    
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        source: "cache"
      })
    }

    // Fetch fresh data from Google Places API
    const placeId = process.env.GOOGLE_PLACE_ID // Planet Motors Google Place ID
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!placeId || !apiKey) {
      // Return fallback data if API not configured
      return NextResponse.json({
        rating: 4.8,
        reviewCount: 277,
        lastUpdated: new Date().toISOString(),
        source: "fallback"
      })
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch Google Places data")
    }

    const data = await response.json()

    if (data.status !== "OK" || !data.result) {
      throw new Error("Invalid response from Google Places API")
    }

    const reviewsData: GoogleReviewsData = {
      rating: data.result.rating || 4.8,
      reviewCount: data.result.user_ratings_total || 277,
      lastUpdated: new Date().toISOString()
    }

    // Cache the data
    if (redis) await redis.set(CACHE_KEY, reviewsData, { ex: CACHE_TTL })

    return NextResponse.json({
      ...reviewsData,
      source: "api"
    })
  } catch (error) {
    console.error("Error fetching Google reviews:", error)
    
    // Return fallback data on error
    return NextResponse.json({
      rating: 4.8,
      reviewCount: 277,
      lastUpdated: new Date().toISOString(),
      source: "fallback"
    })
  }
}

// Endpoint to manually refresh cache (can be called by cron job)
export async function POST(request: Request) {
  const redis = getRedis()
  try {
    const refreshSecret = process.env.INTERNAL_API_SECRET
    if (!refreshSecret) {
      return NextResponse.json(
        { success: false, error: "Cache refresh secret is not configured" },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get("authorization")
    const provided = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!provided || provided !== refreshSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Clear cache to force refresh on next GET
    if (redis) await redis.del(CACHE_KEY)
    
    return NextResponse.json({ 
      success: true, 
      message: "Cache cleared, next request will fetch fresh data" 
    })
  } catch (error) {
    logger.error("[google-reviews] clear cache failed:", error)
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 }
    )
  }
}
