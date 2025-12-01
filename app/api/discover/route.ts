import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserByEmail } from "@/lib/auth"
import { getPreferences } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || "all"
    const featured = searchParams.get("featured") === "true"

    // Get user preferences for personalization if logged in
    let preferences = null
    if (session?.user?.email) {
      const user = await getUserByEmail(session.user.email)
      if (user) {
        preferences = await getPreferences(user.id)
      }
    }

    // Generate discover items using AI
    const items = await generateDiscoverItems(category, featured, preferences)

    return NextResponse.json({ items, category })
  } catch (error) {
    console.error("Error fetching discover items:", error)
    return NextResponse.json(
      { error: "Failed to fetch discover items" },
      { status: 500 }
    )
  }
}

async function generateDiscoverItems(category: string, featured: boolean, preferences: any) {
  const API_KEY = process.env.GEMINI_API_KEY
  if (!API_KEY) {
    throw new Error("Gemini API key not configured")
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${API_KEY}`

  const categoryPrompt = category !== "all" ? `Focus on ${category} category.` : "Include variety from different categories."
  const featuredPrompt = featured ? "Only include exceptional, standout healthy foods." : ""

  const dietaryRestrictions = preferences?.dietType ? `User follows ${preferences.dietType} diet.` : ""
  const allergies = preferences?.allergies?.length ? `User is allergic to: ${preferences.allergies.join(", ")}.` : ""

  const prompt = `You are a nutrition expert AI. Generate 12 healthy food recommendations for users to discover.

${categoryPrompt}
${featuredPrompt}
${dietaryRestrictions}
${allergies}

Categories to choose from: Fruits, Vegetables, Proteins, Grains, Dairy, Snacks, Beverages, Superfoods

Respond ONLY with valid JSON in this format:
{
  "items": [
    {
      "id": "unique_id",
      "name": "Food name",
      "description": "Why this food is healthy and how to enjoy it (2-3 sentences)",
      "healthScore": 85,
      "category": "Category",
      "imageUrl": "https://source.unsplash.com/400x300/?healthy,food,NAME",
      "nutrition": {
        "calories": 100,
        "protein": 5,
        "carbs": 20,
        "fat": 2,
        "fiber": 3
      },
      "tags": ["tag1", "tag2", "tag3"],
      "featured": false
    }
  ]
}

Make the recommendations diverse, practical, and include both common and lesser-known healthy options.
For imageUrl, replace NAME with a URL-encoded version of the food name.`

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to generate discover items")
  }

  const data = await response.json()
  const result = JSON.parse(data.candidates[0].content.parts[0].text)

  return result.items
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, foodName } = await request.json()

    if (action === "details") {
      // Get detailed information about a specific food
      const details = await getFoodDetails(foodName)
      return NextResponse.json({ details })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing discover request:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}

async function getFoodDetails(foodName: string) {
  const API_KEY = process.env.GEMINI_API_KEY
  if (!API_KEY) {
    throw new Error("Gemini API key not configured")
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${API_KEY}`

  const prompt = `Provide detailed nutritional and health information about "${foodName}".

Respond ONLY with valid JSON in this format:
{
  "name": "${foodName}",
  "description": "Comprehensive description of health benefits",
  "healthScore": 85,
  "nutritionPer100g": {
    "calories": 100,
    "protein": 5,
    "carbs": 20,
    "fat": 2,
    "fiber": 3,
    "sugar": 5,
    "sodium": 100,
    "vitamins": ["Vitamin A", "Vitamin C"],
    "minerals": ["Iron", "Calcium"]
  },
  "healthBenefits": [
    "Benefit 1",
    "Benefit 2",
    "Benefit 3"
  ],
  "bestWaysToEat": [
    "Suggestion 1",
    "Suggestion 2"
  ],
  "pairsWith": ["Food 1", "Food 2"],
  "seasonality": "Year-round | Spring | Summer | Fall | Winter",
  "storagesTips": "How to store for freshness",
  "funFact": "An interesting fact about this food"
}`

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to get food details")
  }

  const data = await response.json()
  return JSON.parse(data.candidates[0].content.parts[0].text)
}
