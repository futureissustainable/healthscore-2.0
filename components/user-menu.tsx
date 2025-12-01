"use client"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { User, LogOut, History, Heart, Settings, CreditCard } from "lucide-react"

interface UserMenuProps {
  onOpenHistory?: () => void
  onOpenFavorites?: () => void
  onOpenPreferences?: () => void
  onOpenPricing?: () => void
}

export function UserMenu({
  onOpenHistory,
  onOpenFavorites,
  onOpenPreferences,
  onOpenPricing,
}: UserMenuProps) {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    // Use email sign in for simplicity
    const email = prompt("Enter your email address:")
    if (email) {
      await signIn("credentials", { email, redirect: false })
    }
    setIsLoading(false)
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    setIsOpen(false)
  }

  const handleBillingPortal = async () => {
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error opening billing portal:", error)
    }
  }

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
    )
  }

  if (!session) {
    return (
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
              <p className="font-medium text-slate-900 truncate">
                {session.user?.name || session.user?.email}
              </p>
              <p className="text-sm text-slate-500 truncate">
                {session.user?.email}
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    session.user?.planId === "premium"
                      ? "bg-purple-100 text-purple-700"
                      : session.user?.planId === "pro"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {session.user?.planId === "premium"
                    ? "Premium"
                    : session.user?.planId === "pro"
                      ? "Pro"
                      : "Free"} Plan
                </span>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={() => {
                  onOpenHistory?.()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-3"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span>Scan History</span>
              </button>

              <button
                onClick={() => {
                  onOpenFavorites?.()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-3"
              >
                <Heart className="w-4 h-4 text-slate-500" />
                <span>Favorites</span>
              </button>

              <button
                onClick={() => {
                  onOpenPreferences?.()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-3"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Preferences</span>
              </button>

              {session.user?.planId !== "free" && (
                <button
                  onClick={() => {
                    handleBillingPortal()
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-3"
                >
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <span>Manage Subscription</span>
                </button>
              )}

              {session.user?.planId === "free" && (
                <button
                  onClick={() => {
                    onOpenPricing?.()
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-green-600 hover:bg-green-50 flex items-center space-x-3"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Upgrade Plan</span>
                </button>
              )}
            </div>

            <div className="py-2 border-t border-slate-100">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
