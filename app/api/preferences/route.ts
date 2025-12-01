import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserByEmail } from "@/lib/auth"
import { getPreferences, savePreferences } from "@/lib/db"

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

    const preferences = await getPreferences(user.id)

    // Return default preferences if none exist
    if (!preferences) {
      return NextResponse.json({
        preferences: {
          userId: user.id,
          dietType: "omnivore",
          allergies: [],
          intolerances: [],
          healthGoals: [],
          avoidIngredients: [],
          preferredCuisines: [],
          updatedAt: Date.now(),
        },
      })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()

    const preferences = await savePreferences(user.id, {
      dietType: body.dietType || "omnivore",
      allergies: body.allergies || [],
      intolerances: body.intolerances || [],
      healthGoals: body.healthGoals || [],
      avoidIngredients: body.avoidIngredients || [],
      preferredCuisines: body.preferredCuisines || [],
      calorieTarget: body.calorieTarget,
      proteinTarget: body.proteinTarget,
      carbTarget: body.carbTarget,
      fatTarget: body.fatTarget,
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Error saving preferences:", error)
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    )
  }
}
