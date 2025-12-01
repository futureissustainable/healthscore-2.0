"use client"

import { useState } from "react"
import { useSession, signIn } from "next-auth/react"
import { PLANS } from "@/lib/plans"
import { Button } from "@/components/ui/button"
import { Check, Zap, Crown, Sparkles } from "lucide-react"

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan?: string
}

export function PricingModal({ isOpen, onClose, currentPlan = "free" }: PricingModalProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")

  if (!isOpen) return null

  const handleUpgrade = async (planId: string) => {
    if (!session) {
      // Prompt user to sign in first
      const email = prompt("Please enter your email to sign in:")
      if (email) {
        await signIn("credentials", { email, redirect: false })
      }
      return
    }

    if (planId === "free") {
      onClose()
      return
    }

    setIsLoading(planId)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          interval: billingInterval,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Failed to create checkout session")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Failed to process upgrade. Please try again.")
    } finally {
      setIsLoading(null)
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "free":
        return <Sparkles className="w-6 h-6" />
      case "pro":
        return <Zap className="w-6 h-6" />
      case "premium":
        return <Crown className="w-6 h-6" />
      default:
        return <Sparkles className="w-6 h-6" />
    }
  }

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case "free":
        return "from-slate-500 to-slate-600"
      case "pro":
        return "from-green-500 to-emerald-600"
      case "premium":
        return "from-purple-500 to-indigo-600"
      default:
        return "from-slate-500 to-slate-600"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Choose Your Plan</h2>
              <p className="text-slate-600 mt-1">Upgrade to unlock more scans and premium features</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl font-light"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mt-6">
            <div className="bg-slate-100 p-1 rounded-full flex">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  billingInterval === "monthly"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-600"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  billingInterval === "yearly"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-600"
                }`}
              >
                Yearly
                <span className="ml-1.5 text-xs text-green-600 font-bold">Save 20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isCurrentPlan = currentPlan === plan.id
              const yearlyPrice = plan.price * 12 * 0.8 // 20% discount

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-6 transition-all ${
                    plan.popular
                      ? "border-green-500 shadow-lg shadow-green-500/20 scale-105"
                      : isCurrentPlan
                        ? "border-slate-300 shadow-md"
                        : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlanGradient(plan.id)} flex items-center justify-center mx-auto mb-4 text-white`}
                    >
                      {getPlanIcon(plan.id)}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <div className="mt-3">
                      {billingInterval === "monthly" ? (
                        <>
                          <span className="text-4xl font-bold text-slate-900">
                            ${plan.price}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-slate-500">/month</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-slate-900">
                            ${plan.price === 0 ? 0 : (yearlyPrice / 12).toFixed(2)}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-slate-500">/month</span>
                          )}
                          {plan.price > 0 && (
                            <p className="text-sm text-slate-500 mt-1">
                              ${yearlyPrice.toFixed(2)} billed annually
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-slate-600 mt-3 font-medium">
                      {plan.dailyLimit} scans per day
                    </p>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-slate-600">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    {isCurrentPlan ? (
                      <Button variant="outline" className="w-full bg-transparent" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={isLoading !== null}
                        className={`w-full ${
                          plan.popular
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            : plan.id === "premium"
                              ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                              : "bg-slate-800 hover:bg-slate-700"
                        }`}
                      >
                        {isLoading === plan.id ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </div>
                        ) : plan.price === 0 ? (
                          "Get Started Free"
                        ) : (
                          "Upgrade Now"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <div className="flex items-center justify-center space-x-6 text-sm text-slate-600">
            <span className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-1.5" />
              Cancel anytime
            </span>
            <span className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-1.5" />
              Secure payments via Stripe
            </span>
            <span className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-1.5" />
              Money-back guarantee
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
