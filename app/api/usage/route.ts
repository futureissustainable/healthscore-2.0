import { type NextRequest, NextResponse } from "next/server"
import { getUserUsage, getClientIP } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const usage = await getUserUsage(clientIP)

    return NextResponse.json(usage)
  } catch (error) {
    console.error("Usage check error:", error)
    return NextResponse.json({ error: "Failed to get usage information" }, { status: 500 })
  }
}
