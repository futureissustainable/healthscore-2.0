import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserByEmail } from "@/lib/auth"
import { getMealPlans, saveMealPlan, deleteMealPlan, getPreferences } from "@/lib/db"

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

    // Check if user has Pro or Premium plan
    if (user.planId !== "pro" && user.planId !== "premium") {
      return NextResponse.json(
        { error: "Meal planner is available for Pro and Premium users", upgradeRequired: true },
        { status: 403 }
      )
    }

    const mealPlans = await getMealPlans(user.id)

    return NextResponse.json({ mealPlans })
  } catch (error) {
    console.error("Error fetching meal plans:", error)
    return NextResponse.json(
      { error: "Failed to fetch meal plans" },
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

    // Check if user has Pro or Premium plan
    if (user.planId !== "pro" && user.planId !== "premium") {
      return NextResponse.json(
        { error: "Meal planner is available for Pro and Premium users", upgradeRequired: true },
        { status: 403 }
      )
    }

    const { action, ...data } = await request.json()

    if (action === "generate") {
      // Generate meal plan using AI
      const mealPlan = await generateMealPlan(user.id, data)
      return NextResponse.json({ mealPlan })
    } else if (action === "save") {
      // Save manually created/edited meal plan
      const { name, days } = data
      const mealPlan = await saveMealPlan(user.id, { name, days })
      return NextResponse.json({ mealPlan })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error with meal plan:", error)
    return NextResponse.json(
      { error: "Failed to process meal plan request" },
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

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    const success = await deleteMealPlan(user.id, planId)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete meal plan" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting meal plan:", error)
    return NextResponse.json(
      { error: "Failed to delete meal plan" },
      { status: 500 }
    )
  }
}

async function generateMealPlan(userId: string, options: any) {
  const preferences = await getPreferences(userId)

  const API_KEY = process.env.GEMINI_API_KEY
  if (!API_KEY) {
    throw new Error("Gemini API key not configured")
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent?key=${API_KEY}`

  const daysCount = options.days || 7
  const today = new Date()

  const prompt = `You are a nutritionist AI. Generate a ${daysCount}-day healthy meal plan.

User preferences:
- Diet type: ${preferences?.dietType || "omnivore"}
- Allergies: ${preferences?.allergies?.join(", ") || "None"}
- Health goals: ${preferences?.healthGoals?.join(", ") || "General wellness"}
- Calorie target: ${preferences?.calorieTarget || "2000"} kcal/day
- Preferred cuisines: ${preferences?.preferredCuisines?.join(", ") || "Any"}
- Ingredients to avoid: ${preferences?.avoidIngredients?.join(", ") || "None"}

Additional requests: ${options.additionalRequests || "None"}

Respond ONLY with valid JSON in this format:
{
  "name": "Personalized ${daysCount}-Day Meal Plan",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": {
        "breakfast": {
          "id": "unique_id",
          "name": "Meal name",
          "description": "Brief description",
          "healthScore": 85,
          "calories": 400,
          "protein": 25,
          "carbs": 45,
          "fat": 15,
          "ingredients": ["ingredient1", "ingredient2"],
          "instructions": ["Step 1", "Step 2"],
          "prepTime": 10,
          "cookTime": 15
        },
        "lunch": { ... },
        "dinner": { ... },
        "snacks": [{ ... }]
      }
    }
  ]
}`

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to generate meal plan")
  }

  const data = await response.json()
  const mealPlanData = JSON.parse(data.candidates[0].content.parts[0].text)

  // Save and return the generated meal plan
  const mealPlan = await saveMealPlan(userId, mealPlanData)
  return mealPlan
}
