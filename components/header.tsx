"use client"

import { UserMenu } from "@/components/user-menu"

interface HeaderProps {
  className?: string
  onOpenDiscover?: () => void
  onOpenMealPlanner?: () => void
  onOpenPreferences?: () => void
  onOpenCommunity?: () => void
  onOpenHistory?: () => void
  onOpenFavorites?: () => void
  onOpenPricing?: () => void
}

export function Header({
  className = "",
  onOpenDiscover,
  onOpenMealPlanner,
  onOpenPreferences,
  onOpenCommunity,
  onOpenHistory,
  onOpenFavorites,
  onOpenPricing,
}: HeaderProps) {
  return (
    <header className={`absolute top-0 left-0 right-0 z-20 ${className}`}>
      <nav className="container mx-auto max-w-7xl px-6 py-6 flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center space-x-3">
            <img
              src="https://cdn.prod.website-files.com/68724770b6ac4d56582886e7/68c9ac09ebd0fa4f4e6426b6_Healthscore%20logo.avif"
              alt="Healthscore Logo"
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-slate-900 tracking-tight">HEALTHSCORE</span>
          </div>
          <div className="text-xs text-slate-500 tracking-wider mt-1">BETA</div>
        </div>

        <div className="hidden sm:flex items-center space-x-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-slate-900 font-medium hover:text-slate-700 transition-colors relative"
          >
            Score
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
          </button>
          <button
            onClick={onOpenDiscover}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            Discover
          </button>
          <button
            onClick={onOpenMealPlanner}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            Meal Planner
          </button>
          <button
            onClick={onOpenPreferences}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            Preferences
          </button>
          <button
            onClick={onOpenCommunity}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            Community
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <UserMenu
            onOpenHistory={onOpenHistory}
            onOpenFavorites={onOpenFavorites}
            onOpenPreferences={onOpenPreferences}
            onOpenPricing={onOpenPricing}
          />
        </div>
      </nav>
    </header>
  )
}
