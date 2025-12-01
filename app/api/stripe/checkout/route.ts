import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserByEmail, updateUser } from "@/lib/auth"
import {
  createCheckoutSession,
  createStripeCustomer,
  STRIPE_PRICES,
} from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to upgrade" },
        { status: 401 }
      )
    }

    const { planId, interval = "monthly" } = await request.json()

    if (!planId || !["pro", "premium"].includes(planId)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      )
    }

    const user = await getUserByEmail(session.user.email)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await createStripeCustomer(
        user.email,
        user.name || undefined
      )
      stripeCustomerId = customer.id

      await updateUser(user.email, { stripeCustomerId })
    }

    // Get the price ID for the selected plan
    const priceId =
      interval === "yearly"
        ? STRIPE_PRICES[planId as keyof typeof STRIPE_PRICES].yearly
        : STRIPE_PRICES[planId as keyof typeof STRIPE_PRICES].monthly

    // Create checkout session
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const checkoutSession = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      `${baseUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      `${baseUrl}/?canceled=true`
    )

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
