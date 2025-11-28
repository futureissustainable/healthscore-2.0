import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

console.log("[v0] Redis enabled for rate limiting")

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  error?: string
  planName?: string
}

export async function checkRateLimit(
  identifier: string,
  customLimit?: number,
  window: number = 24 * 60 * 60, // 24 hours in seconds
): Promise<RateLimitResult> {
  try {
    const limit = customLimit || 30
    const key = `rate_limit:${identifier}`

    // Get current usage
    const current = (await redis.get(key)) as number | null
    const used = current || 0

    if (used >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: Math.ceil((Date.now() + window * 1000) / 1000),
        planName: "Free",
      }
    }

    // Increment usage
    const newUsage = await redis.incr(key)

    // Set expiration on first use
    if (newUsage === 1) {
      await redis.expire(key, window)
    }

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - newUsage),
      reset: Math.ceil((Date.now() + window * 1000) / 1000),
      planName: "Free",
    }
  } catch (error) {
    console.error("[v0] Rate limit check failed:", error)
    // Fallback to allowing request
    const limit = customLimit || 30
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((Date.now() + window * 1000) / 1000),
      error: "Rate limiting temporarily unavailable",
      planName: "Free",
    }
  }
}

export function getClientIP(request: Request): string {
  // Try to get the real IP from various headers
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(",")[0].trim()
  }

  // Fallback to a default identifier
  return "unknown"
}

export async function getUserUsage(identifier: string): Promise<{
  used: number
  limit: number
  remaining: number
  resetTime: number
  planName: string
}> {
  try {
    const key = `rate_limit:${identifier}`
    const used = ((await redis.get(key)) as number) || 0
    const limit = 30
    const remaining = Math.max(0, limit - used)

    console.log(`[v0] Current usage: ${used}/${limit}, remaining: ${remaining}`)

    return {
      used,
      limit,
      remaining,
      resetTime: Math.ceil(new Date().setHours(23, 59, 59, 999) / 1000),
      planName: "Free",
    }
  } catch (error) {
    console.error("[v0] Error getting usage:", error)
    // Fallback to localStorage if Redis fails
    let used = 0
    if (typeof window !== "undefined") {
      const today = new Date().toDateString()
      const key = `usage_${today}`
      used = Number.parseInt(localStorage.getItem(key) || "0")
    }

    const limit = 30
    const remaining = Math.max(0, limit - used)

    return {
      used,
      limit,
      remaining,
      resetTime: Math.ceil(new Date().setHours(23, 59, 59, 999) / 1000),
      planName: "Free",
    }
  }
}
