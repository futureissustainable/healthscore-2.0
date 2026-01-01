"use client"

import { useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/header"
import { SearchBar } from "@/components/search-bar"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { ScoreDisplay } from "@/components/score-display"
import { UsageIndicator } from "@/components/usage-indicator"
import { useMobile } from "@/hooks/use-mobile"
import { MailerLiteSignup } from "@/components/mailerlite-signup"
import { FeatureShowcase } from "@/components/feature-showcase"
import { PricingModal } from "@/components/pricing-modal"
import { ScanHistoryModal } from "@/components/scan-history-modal"
import { FavoritesModal } from "@/components/favorites-modal"
import { PreferencesModal } from "@/components/preferences-modal"
import { MealPlannerModal } from "@/components/meal-planner-modal"
import { DiscoverModal } from "@/components/discover-modal"
import { CommunityModal } from "@/components/community-modal"

export default function HomePage() {
  const { data: session } = useSession()
  const [ultraScore, setUltraScore] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  // Modal states
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [isMealPlannerOpen, setIsMealPlannerOpen] = useState(false)
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false)
  const [isCommunityOpen, setIsCommunityOpen] = useState(false)

  const handleSearch = useCallback(async (term: string, image?: string) => {
    const today = new Date().toDateString()
    const key = `usage_${today}`
    const currentUsage = Number.parseInt(localStorage.getItem(key) || "0")
    const limit = 30

    if (currentUsage >= limit) {
      setError("Daily limit of 30 scans reached. Please try again tomorrow.")
      return
    }

    setIsLoading(true)
    setError(null)
    setUltraScore(null)

    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ term, image, requestInDepth: true }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 429) {
          throw new Error(errorData.error || "Rate limit exceeded. Please try again later.")
        }
        throw new Error(errorData.error || "Analysis failed")
      }

      const result = await response.json()

      if (result.trackUsage) {
        localStorage.setItem(key, (currentUsage + 1).toString())
        setUltraScore({ ...result, usageTracked: true })
      } else {
        setUltraScore(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleReset = useCallback(() => {
    setUltraScore(null)
    setError(null)
    setIsLoading(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const showResults = isLoading || error || ultraScore

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground antialiased">
      {/* Warm gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-orange-100/40 via-amber-50/30 to-transparent blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-rose-100/30 via-orange-50/20 to-transparent blur-[120px]"></div>
      </div>

      <Header
        className="relative z-20"
        onOpenDiscover={() => setIsDiscoverOpen(true)}
        onOpenMealPlanner={() => setIsMealPlannerOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onOpenCommunity={() => setIsCommunityOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
      />

      <main className="relative z-10">
        <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 md:pt-40 md:pb-20">
          <div className="container mx-auto max-w-7xl px-content">
            <div className="max-w-3xl mx-auto text-center relative z-10">
              <h1 className="headline text-h-xl font-normal tracking-tight text-balance">
                <span className="text-foreground">Scan. </span>
                <span className="text-primary">Score. </span>
                <span className="text-foreground">Decide.</span>
              </h1>
              <p className="mt-6 max-w-xl mx-auto text-p-lg text-muted-foreground text-pretty px-4 sm:px-0">
                The AI-powered app for health-scoring{" "}
                <span className="font-medium text-foreground">everything.</span>{" "}
                Instantly understand the impact of any product on your well-being.
              </p>
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />

              <div className="mt-6 flex justify-center relative z-10">
                <UsageIndicator key={ultraScore?.usageTracked ? Date.now() : "default"} />
              </div>
            </div>

            <div
              ref={resultsRef}
              className={`transition-base ${showResults ? "opacity-100" : "opacity-0"}`}
            >
              <div
                className={`flex justify-center items-start ${
                  showResults ? "mt-8 sm:mt-12 md:mt-16 min-h-[550px]" : ""
                }`}
              >
                {isLoading && <LoadingState />}
                {error && <ErrorState message={error} onReset={handleReset} />}
                {ultraScore && <ScoreDisplay scoreData={ultraScore} onReset={handleReset} onSearch={handleSearch} />}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 md:py-24 bg-accent/30 border-t border-border relative z-10">
          <div className="container mx-auto max-w-5xl px-content">
            <div className="mb-16 sm:mb-20 md:mb-24">
              <MailerLiteSignup />
            </div>

            <div className="mb-16 sm:mb-20 md:mb-24">
              <FeatureShowcase />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-20 border-t border-border bg-background">
        <div className="container mx-auto max-w-7xl px-content py-12 sm:py-16 text-center text-sm text-muted-foreground">
          <p className="mb-4 text-xs leading-relaxed">
            *The AI-powered analysis is for informational purposes only and may not be 100% accurate. It is not a
            substitute for professional medical or nutritional advice. Always verify product information with the
            manufacturer.
          </p>
          <p className="text-foreground">&copy; 2025 FeelScan. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        currentPlan={session?.user?.planId || "free"}
      />
      <ScanHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectScan={handleSearch}
      />
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        onSelectFavorite={handleSearch}
      />
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
      <MealPlannerModal
        isOpen={isMealPlannerOpen}
        onClose={() => setIsMealPlannerOpen(false)}
      />
      <DiscoverModal
        isOpen={isDiscoverOpen}
        onClose={() => setIsDiscoverOpen(false)}
        onSearch={handleSearch}
      />
      <CommunityModal
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
        onSearch={handleSearch}
      />
    </div>
  )
}
