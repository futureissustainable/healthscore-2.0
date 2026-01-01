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
      <nav className="container mx-auto max-w-7xl px-content py-6 flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center space-x-3">
            <span className="headline text-h-sm font-normal text-foreground tracking-tight uppercase">
              FEELSCAN
            </span>
          </div>
          <div className="text-p-sm text-primary tracking-wider mt-1 uppercase font-medium">Beta</div>
        </div>

        <div className="hidden sm:flex items-center space-x-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-p-sm text-foreground font-medium hover:text-primary transition-base relative"
          >
            Scan
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
          </button>
          <button
            onClick={onOpenDiscover}
            className="text-p-sm text-muted-foreground hover:text-foreground transition-base"
          >
            Discover
          </button>
          <button
            onClick={onOpenMealPlanner}
            className="text-p-sm text-muted-foreground hover:text-foreground transition-base"
          >
            Meal Planner
          </button>
          <button
            onClick={onOpenPreferences}
            className="text-p-sm text-muted-foreground hover:text-foreground transition-base"
          >
            Preferences
          </button>
          <button
            onClick={onOpenCommunity}
            className="text-p-sm text-muted-foreground hover:text-foreground transition-base"
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
