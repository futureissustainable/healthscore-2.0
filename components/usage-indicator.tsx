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
      const limit = 30 // increased limit from 10 to 30
      const remaining = Math.max(0, limit - used)

      // Reset time is end of today
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

    // Listen for storage changes to update usage in real-time
    const handleStorageChange = () => {
      setUsage(getUsageFromLocalStorage())
    }

    window.addEventListener("storage", handleStorageChange)

    // Also check for changes periodically in case localStorage was updated in the same tab
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  if (loading || !usage) return null

  const percentage = (usage.used / usage.limit) * 100
  const resetDate = new Date(usage.resetTime * 1000)
  const isLimitExceeded = usage.used >= usage.limit
  const isNearLimit = usage.remaining <= 2 && !isLimitExceeded

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2 backdrop-blur-sm border rounded-full shadow-sm text-sm ${
        isLimitExceeded ? "bg-red-50/90 border-red-200 text-red-700" : "bg-white/90 border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">Free</span>
        <span className="text-slate-400">•</span>
        {isLimitExceeded ? (
          <span className="font-bold text-red-600">Daily limit reached - resets at midnight</span>
        ) : (
          <span className={`font-bold ${isNearLimit ? "text-red-600" : "text-slate-600"}`}>
            {usage.remaining} daily scans
          </span>
        )}
      </div>

      {!isLimitExceeded && (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isNearLimit ? "bg-red-500" : percentage > 70 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">
            {usage.used}/{usage.limit}
          </span>
        </div>
      )}
    </div>
  )
}
