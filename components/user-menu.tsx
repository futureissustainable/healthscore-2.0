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
      <div className="w-8 h-8 border border-border rounded-full bg-accent animate-pulse" />
    )
  }

  if (!session) {
    return (
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 border border-border rounded-full hover:border-primary/50 transition-colors duration-150 shadow-soft-sm"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-soft-lg z-50 overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="font-medium text-foreground truncate">
                {session.user?.name || session.user?.email}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {session.user?.email}
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                    session.user?.planId === "premium"
                      ? "bg-purple-100 text-purple-600"
                      : session.user?.planId === "pro"
                        ? "bg-green-100 text-green-600"
                        : "bg-muted text-muted-foreground"
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
                className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground flex items-center space-x-3 transition-colors duration-150 rounded-lg mx-1"
              >
                <History className="w-4 h-4" />
                <span>Scan History</span>
              </button>

              <button
                onClick={() => {
                  onOpenFavorites?.()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground flex items-center space-x-3 transition-colors duration-150 rounded-lg mx-1"
              >
                <Heart className="w-4 h-4" />
                <span>Favorites</span>
              </button>

              <button
                onClick={() => {
                  onOpenPreferences?.()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground flex items-center space-x-3 transition-colors duration-150 rounded-lg mx-1"
              >
                <Settings className="w-4 h-4" />
                <span>Preferences</span>
              </button>

              {session.user?.planId !== "free" && (
                <button
                  onClick={() => {
                    handleBillingPortal()
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground flex items-center space-x-3 transition-colors duration-150 rounded-lg mx-1"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Manage Subscription</span>
                </button>
              )}

              {session.user?.planId === "free" && (
                <button
                  onClick={() => {
                    onOpenPricing?.()
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-green-600 hover:bg-green-50 flex items-center space-x-3 transition-colors duration-150 rounded-lg mx-1"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Upgrade Plan</span>
                </button>
              )}
            </div>

            <div className="py-2 border-t border-border">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center space-x-3 transition-colors duration-150 rounded-lg mx-1"
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
