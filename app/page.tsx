"use client"

import { useState, useRef, useCallback } from "react"
import { Header } from "@/components/header"
import { SearchBar } from "@/components/search-bar"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { ScoreDisplay } from "@/components/score-display"
import { GrainyAuroraBackground } from "@/components/grainy-aurora-background"
import { UsageIndicator } from "@/components/usage-indicator"
import { useMobile } from "@/hooks/use-mobile"
import { MailerLiteSignup } from "@/components/mailerlite-signup"
import { FeatureShowcase } from "@/components/feature-showcase"

export default function HomePage() {
  const [ultraScore, setUltraScore] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const resultsRef = useRef(null)
  const isMobile = useMobile()

  const handleSearch = useCallback(async (term: string, image?: string) => {
    const today = new Date().toDateString()
    const key = `usage_${today}`
    const currentUsage = Number.parseInt(localStorage.getItem(key) || "0")
    const limit = 30

    if (currentUsage >= limit) {
      setError("Daily limit of 30 searches reached. Please try again tomorrow.")
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
        body: JSON.stringify({ term, image }),
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

        // Trigger a re-render of usage indicator by updating a state
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
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-slate-900 antialiased">
      <GrainyAuroraBackground />
      <Header className="relative z-20" />

      <main className="relative z-10">
        <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 md:pt-40 md:pb-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center relative z-10">
              <h1 className="text-3xl leading-tight sm:text-4xl sm:leading-snug md:text-5xl lg:text-6xl font-bold tracking-tighter text-balance">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                  Scan.{" "}
                </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500">
                  Score.{" "}
                </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-lime-500 to-green-600">
                  Decide.
                </span>
              </h1>
              <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-slate-600 text-pretty px-4 sm:px-0">
                The AI-powered app for health-scoring <span className="font-bold text-slate-700">everything. </span>
                Instantly understand the impact of any product on your well-being.
              </p>
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />

              <div className="mt-6 flex justify-center relative z-10">
                <UsageIndicator key={ultraScore?.usageTracked ? Date.now() : "default"} />
              </div>
            </div>

            <div
              ref={resultsRef}
              className={`transition-opacity duration-500 relative z-10 ${showResults ? "opacity-100" : "opacity-0"}`}
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

        <section className="py-12 sm:py-16 md:py-24 bg-slate-50 relative z-10">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-16 sm:mb-20 md:mb-24">
              <MailerLiteSignup />
            </div>

            <div className="mb-16 sm:mb-20 md:mb-24">
              <FeatureShowcase />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-20 border-t border-slate-300 bg-slate-800">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 text-center text-sm text-slate-300">
          <p className="mb-4 text-xs leading-relaxed text-slate-400">
            *The AI-powered analysis is for informational purposes only and may not be 100% accurate. It is not a
            substitute for professional medical or nutritional advice. Always verify product information with the
            manufacturer.
          </p>
          <p>&copy; 2025 ULTRASCORE Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
