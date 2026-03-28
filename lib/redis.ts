import { Redis } from '@upstash/redis'

// Upstash Redis client for session caching, rate limiting, and search result caching
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Rate limiting helper for finance applications
export async function rateLimit(
  identifier: string, 
  limit: number = 10, 
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number }> {
  const key = `rate_limit:${identifier}`
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }
  
  return {
    success: current <= limit,
    remaining: Math.max(0, limit - current)
  }
}

// Session caching
export async function setSession(
  sessionId: string, 
  data: Record<string, unknown>, 
  expiresInSeconds: number = 3600
): Promise<void> {
  await redis.set(`session:${sessionId}`, JSON.stringify(data), { ex: expiresInSeconds })
}

export async function getSession(sessionId: string): Promise<Record<string, unknown> | null> {
  const data = await redis.get<string>(`session:${sessionId}`)
  return data ? JSON.parse(data) : null
}

// Search result caching for Typesense queries
export async function cacheSearchResults(
  queryHash: string, 
  results: unknown, 
  ttlSeconds: number = 300
): Promise<void> {
  await redis.set(`search:${queryHash}`, JSON.stringify(results), { ex: ttlSeconds })
}

export async function getCachedSearchResults(queryHash: string): Promise<unknown | null> {
  const data = await redis.get<string>(`search:${queryHash}`)
  return data ? JSON.parse(data) : null
}

// Vehicle reservation lock
export async function lockVehicle(
  stockNumber: string, 
  userId: string, 
  lockDurationSeconds: number = 900 // 15 minutes
): Promise<boolean> {
  const key = `vehicle_lock:${stockNumber}`
  const result = await redis.set(key, userId, { nx: true, ex: lockDurationSeconds })
  return result === 'OK'
}

export async function unlockVehicle(stockNumber: string, userId: string): Promise<boolean> {
  const key = `vehicle_lock:${stockNumber}`
  const currentHolder = await redis.get<string>(key)
  if (currentHolder === userId) {
    await redis.del(key)
    return true
  }
  return false
}

export async function getVehicleLock(stockNumber: string): Promise<string | null> {
  return await redis.get<string>(`vehicle_lock:${stockNumber}`)
}
