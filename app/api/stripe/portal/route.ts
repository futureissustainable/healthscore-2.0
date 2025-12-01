import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserByEmail } from "@/lib/auth"
import { createBillingPortalSession } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to access billing" },
        { status: 401 }
      )
    }

    const user = await getUserByEmail(session.user.email)

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing information found" },
        { status: 404 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const portalSession = await createBillingPortalSession(
      user.stripeCustomerId,
      baseUrl
    )

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("Portal error:", error)
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    )
  }
}
