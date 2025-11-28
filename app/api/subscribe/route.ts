import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, accuracy, feedback } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const apiKey = process.env.MAILERLITE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "MailerLite API key not configured" }, { status: 500 })
    }

    const subscriberData: any = {
      email: email,
      type: "active",
    }

    // Add custom fields if provided
    if (accuracy || feedback) {
      subscriberData.fields = {}
      if (accuracy) {
        subscriberData.fields.accuracy_percentage = accuracy
      }
      if (feedback) {
        subscriberData.fields.general_feedback = feedback
      }
    }

    // MailerLite API v2 endpoint
    const response = await fetch("https://api.mailerlite.com/api/v2/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MailerLite-ApiKey": apiKey,
      },
      body: JSON.stringify(subscriberData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("MailerLite API error:", errorData)

      // Handle duplicate email case
      if (response.status === 400 && errorData.error?.message?.includes("already exists")) {
        return NextResponse.json({ error: "Email already subscribed" }, { status: 400 })
      }

      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
    }

    const result = await response.json()
    return NextResponse.json({ success: true, subscriber: result })
  } catch (error) {
    console.error("Subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
