import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { getStripe, getPlanIdFromPriceId } from "@/lib/stripe"
import { getUserByEmail, updateUser } from "@/lib/auth"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(subscription)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  // Find user by Stripe customer ID
  const email = await findEmailByCustomerId(customerId)
  if (!email) {
    console.error("No user found for customer:", customerId)
    return
  }

  // Get subscription details
  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id
  const planId = getPlanIdFromPriceId(priceId || "")

  await updateUser(email, {
    planId,
    stripeSubscriptionId: subscriptionId,
  })

  console.log(`User ${email} upgraded to ${planId}`)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const email = await findEmailByCustomerId(customerId)

  if (!email) {
    console.error("No user found for customer:", customerId)
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const planId = getPlanIdFromPriceId(priceId || "")
  const status = subscription.status

  if (status === "active" || status === "trialing") {
    await updateUser(email, {
      planId,
      stripeSubscriptionId: subscription.id,
    })
    console.log(`User ${email} subscription updated to ${planId}`)
  } else if (status === "past_due" || status === "unpaid") {
    // Keep the plan but flag the account
    console.log(`User ${email} subscription is ${status}`)
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const email = await findEmailByCustomerId(customerId)

  if (!email) {
    console.error("No user found for customer:", customerId)
    return
  }

  await updateUser(email, {
    planId: "free",
    stripeSubscriptionId: undefined,
  })

  console.log(`User ${email} subscription canceled, downgraded to free`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const email = await findEmailByCustomerId(customerId)

  if (!email) {
    console.error("No user found for customer:", customerId)
    return
  }

  console.log(`Payment failed for user ${email}`)
  // You could send an email notification here
}

async function findEmailByCustomerId(customerId: string): Promise<string | null> {
  try {
    // First, try to get from Stripe
    const stripe = getStripe()
    const customer = await stripe.customers.retrieve(customerId)
    if (!customer.deleted && customer.email) {
      return customer.email
    }

    // Fallback: scan Redis for the customer ID
    // This is inefficient but works as a backup
    const keys = await redis.keys("user:*")
    for (const key of keys) {
      const user = await redis.get(key)
      if (user && (user as any).stripeCustomerId === customerId) {
        return (user as any).email
      }
    }

    return null
  } catch (error) {
    console.error("Error finding email by customer ID:", error)
    return null
  }
}
