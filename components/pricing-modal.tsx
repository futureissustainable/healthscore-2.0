"use client"

import { useState } from "react"
import { PLANS } from "@/lib/plans"
import { Button } from "@/components/ui/button"

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan?: string
}

export function PricingModal({ isOpen, onClose, currentPlan = "free" }: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlan)

  if (!isOpen) return null

  const handleUpgrade = async (planId: string) => {
    // In a real implementation, this would integrate with Stripe
    console.log("Upgrading to plan:", planId)
    // For now, just close the modal
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Choose Your Plan</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl font-light"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p className="text-slate-600 mt-2">Upgrade to get more scans and advanced features</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 transition-all ${
                  plan.popular
                    ? "border-green-500 shadow-lg scale-105"
                    : selectedPlan === plan.id
                      ? "border-slate-300 shadow-md"
                      : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                    {plan.price > 0 && <span className="text-slate-500">/{plan.interval}</span>}
                  </div>
                  <p className="text-slate-600 mt-2">{plan.dailyLimit} scans per day</p>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-slate-600">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {currentPlan === plan.id ? (
                    <Button variant="outline" className="w-full bg-transparent" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      className={`w-full ${
                        plan.popular ? "bg-green-600 hover:bg-green-700" : "bg-slate-800 hover:bg-slate-700"
                      }`}
                    >
                      {plan.price === 0 ? "Current Plan" : "Upgrade Now"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <p className="text-sm text-slate-600 text-center">
            All plans include our core health scoring features. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
