import { Redis } from "@upstash/redis"
import { getDefaultPlan, getPlanById, type Plan } from "./plans"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

console.log("[v0] Redis enabled for user plan management")

export interface UserPlan {
  userId: string
  planId: string
  status: "active" | "cancelled" | "expired"
  startDate: number
  endDate?: number
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

export async function getUserPlan(userId: string): Promise<Plan> {
  try {
    const userPlanKey = `user_plan:${userId}`
    console.log("[v0] Getting user plan for key:", userPlanKey)

    const userPlanData = (await redis.get(userPlanKey)) as UserPlan | null

    if (!userPlanData || userPlanData.status !== "active") {
      console.log("[v0] No active user plan found, using default")
      return getDefaultPlan()
    }

    // Check if plan is expired
    if (userPlanData.endDate && userPlanData.endDate < Date.now()) {
      // Mark as expired
      await redis.set(userPlanKey, { ...userPlanData, status: "expired" })
      console.log("[v0] User plan expired, using default")
      return getDefaultPlan()
    }

    const plan = getPlanById(userPlanData.planId)
    console.log("[v0] Found user plan:", plan?.name || "unknown")
    return plan || getDefaultPlan()
  } catch (error) {
    console.error("[v0] Error getting user plan:", error)
    return getDefaultPlan()
  }
}

export async function setUserPlan(userId: string, planData: UserPlan): Promise<void> {
  try {
    const userPlanKey = `user_plan:${userId}`
    await redis.set(userPlanKey, planData)

    // Set expiration if there's an end date
    if (planData.endDate) {
      const ttl = Math.ceil((planData.endDate - Date.now()) / 1000)
      if (ttl > 0) {
        await redis.expire(userPlanKey, ttl)
      }
    }
  } catch (error) {
    console.error("[v0] Error setting user plan:", error)
    throw error
  }
}

export async function cancelUserPlan(userId: string): Promise<void> {
  try {
    const userPlanKey = `user_plan:${userId}`
    const userPlanData = (await redis.get(userPlanKey)) as UserPlan | null

    if (userPlanData) {
      await redis.set(userPlanKey, { ...userPlanData, status: "cancelled" })
    }
  } catch (error) {
    console.error("[v0] Error cancelling user plan:", error)
    throw error
  }
}
