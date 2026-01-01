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

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border shadow-brutal-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="headline text-2xl font-normal text-white">Choose Your Plan</h2>
              <p className="text-muted-foreground mt-1">Upgrade to unlock more scans and premium features</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-white text-2xl font-light transition-colors duration-100"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="flex justify-center mt-6">
            <div className="bg-accent border border-border p-1 flex">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`px-4 py-2 text-sm font-medium transition-all duration-100 ${
                  billingInterval === "monthly"
                    ? "bg-white text-black"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-4 py-2 text-sm font-medium transition-all duration-100 ${
                  billingInterval === "yearly"
                    ? "bg-white text-black"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                Yearly
                <span className="ml-1.5 text-xs text-green-500 font-medium">Save 20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isCurrentPlan = currentPlan === plan.id
              const yearlyPrice = plan.price * 12 * 0.8

              return (
                <div
                  key={plan.id}
                  className={`relative border-2 p-6 transition-all duration-100 ${
                    plan.popular
                      ? "border-white shadow-brutal-white"
                      : isCurrentPlan
                        ? "border-muted-foreground"
                        : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-white text-black px-4 py-1 text-sm font-medium uppercase tracking-wider">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="w-12 h-12 border-2 border-white flex items-center justify-center mx-auto mb-4 text-white">
                      {getPlanIcon(plan.id)}
                    </div>
                    <h3 className="headline text-xl font-normal text-white">{plan.name}</h3>
                    <div className="mt-3">
                      {billingInterval === "monthly" ? (
                        <>
                          <span className="headline text-4xl font-normal text-white">
                            ${plan.price}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-muted-foreground">/month</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="headline text-4xl font-normal text-white">
                            ${plan.price === 0 ? 0 : (yearlyPrice / 12).toFixed(2)}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-muted-foreground">/month</span>
                          )}
                          {plan.price > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              ${yearlyPrice.toFixed(2)} billed annually
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-white mt-3 font-medium">
                      {plan.dailyLimit} scans per day
                    </p>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-muted-foreground">
                        <div className="w-5 h-5 border border-green-500 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-green-500" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    {isCurrentPlan ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={isLoading !== null}
                        className="w-full"
                      >
                        {isLoading === plan.id ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin mr-2" />
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

        <div className="p-6 border-t border-border bg-accent/30">
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
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
