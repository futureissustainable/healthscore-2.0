"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function MailerLiteSignup() {
  const [email, setEmail] = useState("")
  const [accuracy, setAccuracy] = useState("")
  const [featurePriority, setFeaturePriority] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, accuracy, featurePriority, feedback }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to subscribe")
      }

      setIsSuccess(true)
      setEmail("")
      setAccuracy("")
      setFeaturePriority("")
      setFeedback("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-green-500/10 border-2 border-green-500 p-8 animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="headline text-xl font-normal text-white mb-2">You're all set!</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We'll keep you updated on the full release and new features.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 border border-white text-white px-3 py-1 text-xs font-medium uppercase tracking-wider mb-4">
          <div className="w-2 h-2 bg-white animate-pulse-glow"></div>
          Early Access
        </div>
        <h3 className="headline text-2xl font-normal text-white mb-3 text-balance">Sign up for updates on full release!</h3>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
          Be the first to know when we launch new features and improvements. Help us build the perfect nutrition
          companion.
        </p>
      </div>

      <div className="relative">
        <div className="border border-border bg-background p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-white">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="accuracy" className="text-sm font-medium text-white">
                  Accuracy rating
                </label>
                <div className="relative">
                  <Input
                    id="accuracy"
                    type="number"
                    placeholder="85"
                    value={accuracy}
                    onChange={(e) => setAccuracy(e.target.value)}
                    min="0"
                    max="100"
                    disabled={isLoading}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="feature-priority" className="text-sm font-medium text-white">
                  Most needed feature
                </label>
                <select
                  id="feature-priority"
                  className="h-10 w-full border border-border bg-transparent px-4 py-2 text-sm text-white focus:border-white focus:outline-2 focus:outline-white focus:outline-offset-2 transition-colors duration-100"
                  disabled={isLoading}
                  value={featurePriority}
                  onChange={(e) => setFeaturePriority(e.target.value)}
                >
                  <option value="" className="bg-background">Select feature</option>
                  <option value="meal-planner" className="bg-background">Meal Planner</option>
                  <option value="preferences" className="bg-background">Dietary Preferences</option>
                  <option value="community" className="bg-background">Community Features</option>
                  <option value="discover" className="bg-background">Discover New Foods</option>
                  <option value="history" className="bg-background">Scan History</option>
                  <option value="favourites" className="bg-background">Favourites List</option>
                  <option value="detailed-analysis" className="bg-background">More In-Depth Analysis</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="feedback" className="text-sm font-medium text-white">
                Why do you need this feature?
              </label>
              <Textarea
                id="feedback"
                placeholder="Tell us why this feature would be valuable to you and how you'd use it..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black animate-spin"></div>
                  Signing up...
                </div>
              ) : (
                "Get Early Access"
              )}
            </Button>

            {error && (
              <div className="border-2 border-red-500 bg-red-500/10 p-3">
                <p className="text-red-500 text-sm text-center">{error}</p>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          Fully Secure
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          No Spam, Ever
        </div>
      </div>
    </div>
  )
}
