import Stripe from "stripe"

// Lazy initialization to avoid build-time errors when env vars aren't available
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set")
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
      typescript: true,
    })
  }
  return _stripe
}

export const STRIPE_PRICES = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "price_pro_yearly",
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || "price_premium_monthly",
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || "price_premium_yearly",
  },
}

export interface StripeCustomerData {
  id: string
  email: string
  name?: string
}

export async function createStripeCustomer(
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      source: "healthscore",
    },
  })
  return customer
}

export async function getStripeCustomer(
  customerId: string
): Promise<Stripe.Customer | null> {
  try {
    const stripe = getStripe()
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return null
    return customer as Stripe.Customer
  } catch (error) {
    console.error("Error retrieving Stripe customer:", error)
    return null
  }
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  })
  return session
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session
}

export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error("Error retrieving subscription:", error)
    return null
  }
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.cancel(subscriptionId)
    return subscription
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return null
  }
}

export function getPlanIdFromPriceId(priceId: string): string {
  if (
    priceId === STRIPE_PRICES.premium.monthly ||
    priceId === STRIPE_PRICES.premium.yearly
  ) {
    return "premium"
  }
  if (
    priceId === STRIPE_PRICES.pro.monthly ||
    priceId === STRIPE_PRICES.pro.yearly
  ) {
    return "pro"
  }
  return "free"
}
