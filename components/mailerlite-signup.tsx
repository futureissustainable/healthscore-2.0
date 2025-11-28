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
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/60 rounded-2xl p-8 shadow-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">You're all set!</h3>
            <p className="text-green-700/80 text-sm leading-relaxed">
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
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          Early Access
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3 text-balance">Sign up for updates on full release!</h3>
        <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
          Be the first to know when we launch new features and improvements. Help us build the perfect nutrition
          companion.
        </p>
      </div>

      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 rounded-2xl opacity-0 group-hover:opacity-20 animate-subtleGlow blur-sm transition-opacity duration-500"></div>
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm relative group">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
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
                className="h-11 border-slate-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="accuracy" className="text-sm font-medium text-slate-700">
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
                    className="h-11 border-slate-200 focus:border-orange-300 focus:ring-orange-200 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="feature-priority" className="text-sm font-medium text-slate-700">
                  Most needed feature
                </label>
                <select
                  id="feature-priority"
                  className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-300 focus:ring-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                  disabled={isLoading}
                  value={featurePriority}
                  onChange={(e) => setFeaturePriority(e.target.value)}
                >
                  <option value="">Select feature</option>
                  <option value="meal-planner">Meal Planner</option>
                  <option value="preferences">Dietary Preferences</option>
                  <option value="community">Community Features</option>
                  <option value="discover">Discover New Foods</option>
                  <option value="history">Scan History</option>
                  <option value="favourites">Favourites List</option>
                  <option value="detailed-analysis">More In-Depth Analysis</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="feedback" className="text-sm font-medium text-slate-700">
                Why do you need this feature?
              </label>
              <Textarea
                id="feedback"
                placeholder="Tell us why this feature would be valuable to you and how you'd use it..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="border-slate-200 focus:border-orange-300 focus:ring-orange-200 resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing up...
                </div>
              ) : (
                "Get Early Access"
              )}
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm text-center">{error}</p>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500">
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
