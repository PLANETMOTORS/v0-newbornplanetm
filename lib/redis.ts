// Redis utilities - only initializes when env vars are present
// These functions gracefully degrade when Redis is not configured

import type { Redis } from "@upstash/redis"

let redisClient: Redis | null = null

async function getRedis(): Promise<Redis | null> {
  if (redisClient) return redisClient
  
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null
  }
  
  try {
    const { Redis: UpstashRedis } = await import('@upstash/redis')
    redisClient = new UpstashRedis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    }) as Redis
    return redisClient
  } catch (error) {
    console.warn("[Redis] Failed to initialize client:", (error as Error).message)
    return null
  }
}

// Rate limiting helper for finance applications
export async function rateLimit(
  identifier: string, 
  limit: number = 10, 
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number }> {
  const redis = await getRedis()
  if (!redis) return { success: true, remaining: limit }
  
  try {
    const key = `rate_limit:${identifier}`
    const current = await redis.incr(key)
    
    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }
    
    return {
      success: current <= limit,
      remaining: Math.max(0, limit - current)
    }
  } catch (error) {
    console.warn("[Redis] Rate limit check failed, allowing request:", (error as Error).message)
    return { success: true, remaining: limit }
  }
}

// Session caching
export async function setSession(
  sessionId: string, 
  data: Record<string, unknown>, 
  expiresInSeconds: number = 3600
): Promise<void> {
  const redis = await getRedis()
  if (!redis) return
  
  try {
    await redis.set(`session:${sessionId}`, JSON.stringify(data), { ex: expiresInSeconds })
  } catch (error) {
    console.warn("[Redis] Failed to set session:", (error as Error).message)
  }
}

export async function getSession(sessionId: string): Promise<Record<string, unknown> | null> {
  const redis = await getRedis()
  if (!redis) return null
  
  try {
    const data = await redis.get<string>(`session:${sessionId}`)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.warn("[Redis] Failed to get session:", (error as Error).message)
    return null
  }
}

// Search result caching for Typesense queries
export async function cacheSearchResults(
  queryHash: string, 
  results: unknown, 
  ttlSeconds: number = 300
): Promise<void> {
  const redis = await getRedis()
  if (!redis) return
  
  try {
    await redis.set(`search:${queryHash}`, JSON.stringify(results), { ex: ttlSeconds })
  } catch (error) {
    console.warn("[Redis] Failed to cache search results:", (error as Error).message)
  }
}

export async function deleteCachedSearchResults(queryHash: string): Promise<void> {
  const redis = await getRedis()
  if (!redis) return

  try {
    await redis.del(`search:${queryHash}`)
  } catch (error) {
    console.warn("[Redis] Failed to delete cached search results:", (error as Error).message)
  }
}

export async function getCachedSearchResults(queryHash: string): Promise<unknown | null> {
  const redis = await getRedis()
  if (!redis) return null
  
  try {
    const data = await redis.get<string>(`search:${queryHash}`)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.warn("[Redis] Failed to get cached search results:", (error as Error).message)
    return null
  }
}

// Vehicle reservation lock
export async function lockVehicle(
  stockNumber: string, 
  userId: string, 
  lockDurationSeconds: number = 900
): Promise<boolean> {
  const redis = await getRedis()
  if (!redis) return true // Allow if Redis not available
  
  try {
    const key = `vehicle_lock:${stockNumber}`

    // Treat repeated lock attempts from the same user as successful idempotent retries,
    // but refresh TTL atomically to avoid extending a lock acquired by another user.
    const refreshTtlScript = `
      local current = redis.call('GET', KEYS[1])
      if current == ARGV[1] then
        redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
        return 1
      end
      return 0
    `

    const refreshed = await (redis as unknown as {
      eval: (script: string, keys: string[], args: string[]) => Promise<number>
    }).eval(refreshTtlScript, [key], [userId, String(lockDurationSeconds)])

    if (refreshed === 1) {
      return true
    }

    const result = await redis.set(key, userId, { nx: true, ex: lockDurationSeconds })
    return result === "OK"
  } catch (error) {
    console.warn("[Redis] Failed to lock vehicle:", (error as Error).message)
    return true
  }
}

export async function unlockVehicle(stockNumber: string, userId: string): Promise<boolean> {
  const redis = await getRedis()
  if (!redis) return true
  
  try {
    const key = `vehicle_lock:${stockNumber}`

    // Atomic compare-and-delete: only delete the key if the stored value matches userId.
    // Prevents a key-expiry race where GET succeeds but the lock has since been acquired
    // by another user before DEL executes.
    const compareAndDeleteScript = `
      if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
      end
      return 0
    `

    const deleted = await (redis as unknown as {
      eval: (script: string, keys: string[], args: string[]) => Promise<number>
    }).eval(compareAndDeleteScript, [key], [userId])

    return deleted === 1
  } catch (error) {
    console.warn("[Redis] Failed to unlock vehicle:", (error as Error).message)
    return true
  }
}

export async function getVehicleLock(stockNumber: string): Promise<string | null> {
  const redis = await getRedis()
  if (!redis) return null
  
  try {
    return await redis.get<string>(`vehicle_lock:${stockNumber}`)
  } catch (error) {
    console.warn("[Redis] Failed to get vehicle lock:", (error as Error).message)
    return null
  }
}

// Verification code storage
export async function storeVerificationCode(
  destination: string,
  code: string,
  ttlSeconds: number = 600
): Promise<boolean> {
  const redis = await getRedis()
  if (!redis) return false

  try {
    await redis.set(`verify:${destination}`, code, { ex: ttlSeconds })
    return true
  } catch (error) {
    console.warn("[Redis] Failed to store verification code:", (error as Error).message)
    return false
  }
}

export async function getVerificationCode(destination: string): Promise<string | null> {
  const redis = await getRedis()
  if (!redis) return null

  try {
    return await redis.get<string>(`verify:${destination}`)
  } catch (error) {
    console.warn("[Redis] Failed to get verification code:", (error as Error).message)
    return null
  }
}

export async function deleteVerificationCode(destination: string): Promise<void> {
  const redis = await getRedis()
  if (!redis) return

  try {
    await redis.del(`verify:${destination}`)
  } catch (error) {
    console.warn("[Redis] Failed to delete verification code:", (error as Error).message)
  }
}
