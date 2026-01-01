"use client"

import { useState, useEffect } from "react"

interface UsageData {
  used: number
  limit: number
  remaining: number
  resetTime: number
  planName: string
}

export function UsageIndicator() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUsageFromLocalStorage = () => {
      const today = new Date().toDateString()
      const key = `usage_${today}`
      const used = Number.parseInt(localStorage.getItem(key) || "0")
      const limit = 30
      const remaining = Math.max(0, limit - used)

      const resetTime = Math.ceil(new Date().setHours(23, 59, 59, 999) / 1000)

      return {
        used,
        limit,
        remaining,
        resetTime,
        planName: "Free",
      }
    }

    setUsage(getUsageFromLocalStorage())
    setLoading(false)

    const handleStorageChange = () => {
      setUsage(getUsageFromLocalStorage())
    }

    window.addEventListener("storage", handleStorageChange)
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  if (loading || !usage) return null

  const percentage = (usage.used / usage.limit) * 100
  const isLimitReached = usage.used >= usage.limit
  const isNearLimit = usage.remaining <= 2 && !isLimitReached

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2 border text-sm ${
        isLimitReached
          ? "bg-red-500/10 border-red-500 text-red-500"
          : "bg-accent/50 border-border text-muted-foreground"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-white">Free</span>
        <span className="text-muted">•</span>
        {isLimitReached ? (
          <span className="font-medium text-red-500">Daily limit reached - resets at midnight</span>
        ) : (
          <span className={`font-medium ${isNearLimit ? "text-red-500" : "text-white"}`}>
            {usage.remaining} daily scans
          </span>
        )}
      </div>

      {!isLimitReached && (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-border h-1">
            <div
              className={`h-1 transition-all duration-100 ${
                isNearLimit ? "bg-red-500" : percentage > 70 ? "bg-yellow-400" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {usage.used}/{usage.limit}
          </span>
        </div>
      )}
    </div>
  )
}
