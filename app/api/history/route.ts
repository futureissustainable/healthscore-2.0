import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserByEmail } from "@/lib/auth"
import { getScanHistory, deleteScan } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has Pro or Premium plan for full history
    const isPaidUser = user.planId === "pro" || user.planId === "premium"

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Free users can only see last 10 scans
    const effectiveLimit = isPaidUser ? limit : Math.min(limit, 10)

    const history = await getScanHistory(user.id, effectiveLimit, offset)

    return NextResponse.json({
      history,
      isPaidUser,
      hasMore: history.length === effectiveLimit,
    })
  } catch (error) {
    console.error("Error fetching scan history:", error)
    return NextResponse.json(
      { error: "Failed to fetch scan history" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { scanId } = await request.json()

    if (!scanId) {
      return NextResponse.json({ error: "Scan ID required" }, { status: 400 })
    }

    const success = await deleteScan(user.id, scanId)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete scan" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting scan:", error)
    return NextResponse.json(
      { error: "Failed to delete scan" },
      { status: 500 }
    )
  }
}
