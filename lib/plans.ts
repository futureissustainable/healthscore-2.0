export interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: "month" | "year"
  dailyLimit: number
  features: string[]
  popular?: boolean
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    interval: "month",
    dailyLimit: 30,
    features: ["30 scans per day", "Basic health scoring", "Product recommendations", "Mobile app access"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9.99,
    currency: "USD",
    interval: "month",
    dailyLimit: 100,
    features: [
      "100 scans per day",
      "Advanced health insights",
      "Detailed nutritional breakdown",
      "Priority AI processing",
      "Export scan history",
      "Email support",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 19.99,
    currency: "USD",
    interval: "month",
    dailyLimit: 500,
    features: [
      "500 scans per day",
      "All Pro features",
      "Custom health goals",
      "API access",
      "White-label options",
      "Priority support",
    ],
  },
]

export function getPlanById(planId: string): Plan | null {
  return PLANS.find((plan) => plan.id === planId) || null
}

export function getDefaultPlan(): Plan {
  return PLANS[0] // Free plan
}
