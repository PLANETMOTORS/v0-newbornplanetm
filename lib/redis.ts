// Redis utilities - only initializes when env vars are present
// These functions gracefully degrade when Redis is not configured

type RedisClient = {
  incr: (key: string) => Promise<number>
  expire: (key: string, seconds: number) => Promise<number>
  set: (key: string, value: string, options?: { ex?: number; nx?: boolean }) => Promise<string | null>
  get: <T = string>(key: string) => Promise<T | null>
  del: (key: string) => Promise<number>
}

let redisClient: RedisClient | null = null

async function getRedis(): Promise<RedisClient | null> {
  if (redisClient) return redisClient
  
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null
  }
  
  try {
    const { Redis } = await import('@upstash/redis')
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
    return redisClient
  } catch {
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
  } catch {
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
  } catch {
    // Silently fail
  }
}

export async function getSession(sessionId: string): Promise<Record<string, unknown> | null> {
  const redis = await getRedis()
  if (!redis) return null
  
  try {
    const data = await redis.get<string>(`session:${sessionId}`)
    return data ? JSON.parse(data) : null
  } catch {
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
  } catch {
    // Silently fail
  }
}

export async function getCachedSearchResults(queryHash: string): Promise<unknown | null> {
  const redis = await getRedis()
  if (!redis) return null
  
  try {
    const data = await redis.get<string>(`search:${queryHash}`)
    return data ? JSON.parse(data) : null
  } catch {
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
    const result = await redis.set(key, userId, { nx: true, ex: lockDurationSeconds })
    return result === 'OK'
  } catch {
    return true
  }
}

export async function unlockVehicle(stockNumber: string, userId: string): Promise<boolean> {
  const redis = await getRedis()
  if (!redis) return true
  
  try {
    const key = `vehicle_lock:${stockNumber}`
    const currentHolder = await redis.get<string>(key)
    if (currentHolder === userId) {
      await redis.del(key)
      return true
    }
    return false
  } catch {
    return true
  }
}

export async function getVehicleLock(stockNumber: string): Promise<string | null> {
  const redis = await getRedis()
  if (!redis) return null
  
  try {
    return await redis.get<string>(`vehicle_lock:${stockNumber}`)
  } catch {
    return null
  }
}
