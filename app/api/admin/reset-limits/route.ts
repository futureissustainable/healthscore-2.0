import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    // Simple admin check - you might want to add proper authentication
    const authHeader = request.headers.get("authorization")
    if (authHeader !== "Bearer admin-reset-key") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Admin: Resetting all usage limits...")

    // Get all keys that match usage patterns
    const today = new Date().toDateString()
    const usageKeys = await redis.keys(`usage_${today}*`)
    const rateLimitKeys = await redis.keys("rate_limit:*")

    // Delete all usage tracking keys
    if (usageKeys.length > 0) {
      await redis.del(...usageKeys)
      console.log(`[v0] Admin: Deleted ${usageKeys.length} usage keys`)
    }

    if (rateLimitKeys.length > 0) {
      await redis.del(...rateLimitKeys)
      console.log(`[v0] Admin: Deleted ${rateLimitKeys.length} rate limit keys`)
    }

    // Also clear localStorage-based tracking by returning reset instruction
    return NextResponse.json({
      success: true,
      message: `Reset ${usageKeys.length + rateLimitKeys.length} usage records`,
      resetLocalStorage: true,
    })
  } catch (error) {
    console.error("[v0] Admin reset error:", error)
    return NextResponse.json({ error: "Failed to reset limits" }, { status: 500 })
  }
}
