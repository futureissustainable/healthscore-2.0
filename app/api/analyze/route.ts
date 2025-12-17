import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { authOptions, getUserByEmail } from "@/lib/auth"
import { addScanToHistory } from "@/lib/db"

// Types for the analysis
interface ProductAnalysis {
  isConsumerProduct: boolean
  isBestInClass?: boolean | null
  rejectionReason?: string | null
  trustScore?: number | null
  productName?: string | null
  productCategory?: "Food" | "Beverage" | "PersonalCare" | null
  processingLevel?:
    | "Unprocessed/Minimally Processed"
    | "Processed Culinary Ingredients"
    | "Processed Foods"
    | "Ultra-Processed Foods"
    | null
  harmfulAdditives?: {
    hasArtificialSweeteners: boolean
    hasIndustrialEmulsifiers: boolean
    hasArtificialColorsFlavors: boolean
  } | null
  nutrientsPer100g?: {
    calories: number
    carbohydratesG: number
    totalFatG: number
    proteinG: number
    addedSugarG: number
    sodiumMg: number
    saturatedFatG: number
    unsaturatedFatG: number
    fiberG: number
  } | null
  proteinQuality?: "High-Quality Whole-Food" | "High-Quality Plant-Based" | "None" | null
  hasTransFat?: boolean | null
  wholeFoodContentPercentage?: number | null
  personalCareDetails?: {
    harmfulIngredients: string[]
    beneficialIngredients: string[]
    hasFragrance: boolean
    isCrueltyFree: boolean
  } | null
  healthierAddon?: {
    productName: string
    description: string
    scoreBoost: number
  } | null
  topInCategory?: {
    productName: string
    description: string
  } | null
}

interface ScoreResult {
  finalScore: number
  isBestInClass: boolean
  trustScore: number
  category: string
  productName: string
  breakdown: {
    baseScore: number
    adjustments: Array<{ reason: string; points: number }>
  }
  healthierAddon?: any
  topInCategory?: any
  nutrients?: any
  overrideReason?: string | null
  inDepthAnalysis?: InDepthAnalysis | null
}

interface InDepthAnalysis {
  healthImpact: {
    shortTerm: string[]
    longTerm: string[]
    benefits: string[]
    concerns: string[]
  }
  ingredientBreakdown: Array<{
    name: string
    purpose: string
    safetyRating: "Safe" | "Generally Safe" | "Use Caution" | "Avoid"
    details: string
  }>
  comparisonToAlternatives: Array<{
    productName: string
    score: number
    keyDifference: string
  }>
  personalizedAdvice: string
  scientificSources: string[]
}

async function analyzeProductWithGemini(textInput: string, base64Image?: string): Promise<ProductAnalysis> {
  console.log("[v0] Checking GEMINI_API_KEY availability...")
  console.log(
    "[v0] Environment keys available:",
    Object.keys(process.env).filter((key) => key.includes("GEMINI")),
  )

  const API_KEY = process.env.GEMINI_API_KEY
  if (!API_KEY) {
    console.error("[v0] GEMINI_API_KEY is undefined or empty")
    throw new Error("Gemini API key not configured")
  }

  console.log("[v0] GEMINI_API_KEY found, length:", API_KEY.length)

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent?key=${API_KEY}`

  const prompt = `You are ULTRASCORE, analyzing consumer products for health. Respond ONLY with valid JSON in this exact format:
{
  "isConsumerProduct": boolean,
  "isBestInClass": boolean,
  "rejectionReason": string | null,
  "trustScore": number,
  "productName": string,
  "productCategory": "Food" | "Beverage" | "PersonalCare",
  "processingLevel": "Unprocessed/Minimally Processed" | "Processed Culinary Ingredients" | "Processed Foods" | "Ultra-Processed Foods",
  "harmfulAdditives": { "hasArtificialSweeteners": boolean, "hasIndustrialEmulsifiers": boolean, "hasArtificialColorsFlavors": boolean },
  "nutrientsPer100g": { "calories": number, "carbohydratesG": number, "totalFatG": number, "proteinG": number, "addedSugarG": number, "sodiumMg": number, "saturatedFatG": number, "unsaturatedFatG": number, "fiberG": number },
  "proteinQuality": "High-Quality Whole-Food" | "High-Quality Plant-Based" | "None",
  "hasTransFat": boolean,
  "wholeFoodContentPercentage": number,
  "personalCareDetails": { "harmfulIngredients": string[], "beneficialIngredients": string[], "hasFragrance": boolean, "isCrueltyFree": boolean } | null,
  "healthierAddon": { "productName": string, "description": string, "scoreBoost": number } | null,
  "topInCategory": { "productName": string, "description": string } | null
}`

  const requestBody: any = {
    contents: [{ parts: [{ text: prompt }, { text: `Product: ${textInput}` }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
  }

  if (base64Image) {
    requestBody.contents[0].parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: base64Image,
      },
    })
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    let errorMessage = `AI API request failed: ${response.status} ${response.statusText}`
    try {
      const errorBody = await response.json()
      console.error("Gemini API Error:", errorBody)
      errorMessage = `AI API request failed: ${errorBody.error?.message || response.statusText}`
    } catch (parseError) {
      // If we can't parse the error as JSON, use the response text
      try {
        const errorText = await response.text()
        console.error("Gemini API Error (text):", errorText)
        errorMessage = `AI API request failed: ${errorText.substring(0, 100)}...`
      } catch (textError) {
        console.error("Failed to read error response:", textError)
      }
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()

  try {
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("AI returned no response. The input may have been blocked.")
    }
    const jsonString = data.candidates[0].content.parts[0].text
    console.log("[v0] Raw AI response:", jsonString.substring(0, 200) + "...")

    let parsedJson
    try {
      parsedJson = JSON.parse(jsonString)
    } catch (jsonError) {
      console.error("JSON Parse Error:", jsonError)
      console.error("Raw response that failed to parse:", jsonString)
      throw new Error("AI returned malformed data. Please try again.")
    }

    if (!parsedJson.isConsumerProduct) {
      throw new Error(parsedJson.rejectionReason || "The item is not a recognized consumer product.")
    }
    return parsedJson
  } catch (e) {
    console.error("Failed to process AI response:", e)
    if (e instanceof Error && e.message.includes("consumer product")) {
      throw e // Re-throw consumer product errors as-is
    }
    throw new Error("AI analysis failed. Please try again with a different product.")
  }
}

async function performCommonSenseCheck(productData: ProductAnalysis, initialScore: ScoreResult): Promise<ScoreResult> {
  if (initialScore.finalScore < 20) return { ...initialScore, overrideReason: null }

  const API_KEY = process.env.GEMINI_API_KEY
  if (!API_KEY) {
    console.warn("Gemini API key not configured for common sense check")
    return { ...initialScore, overrideReason: null }
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent?key=${API_KEY}`

  const prompt = `You are a safety and common sense validation AI. Your task is to identify dangerously misleading health scores. The algorithm scores based on nutritional data but can be fooled by inedible or poisonous items (e.g., scoring 'Cyanide Water' as 100). Product Name: "${productData.productName}", Initial Score: ${initialScore.finalScore}/100. **Task:** Evaluate if the score is absurd or dangerous (Toxic, Inedible, etc.). **Response Format:** If plausible, respond ONLY with: {"isMisleading": false}. If dangerous, respond ONLY with: {"isMisleading": true, "correctedScore": 0, "reason": "A brief, user-facing explanation."}. Only override for clear, unambiguous cases of danger.`

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.0 },
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      console.warn("Common sense check failed, returning original score.")
      return { ...initialScore, overrideReason: null }
    }

    const data = await response.json()
    const validation = JSON.parse(data.candidates[0].content.parts[0].text)

    if (validation.isMisleading) {
      console.warn(`Common sense override for "${productData.productName}". Reason: ${validation.reason}`)
      return {
        ...initialScore,
        finalScore: validation.correctedScore,
        category: "Avoid",
        overrideReason: validation.reason,
        healthierAddon: null,
        topInCategory: null,
        breakdown: {
          baseScore: initialScore.breakdown.baseScore,
          adjustments: [{ reason: `Safety Override: ${validation.reason}`, points: -100 }],
        },
      }
    }

    return { ...initialScore, overrideReason: null }
  } catch (error) {
    console.warn("Failed to perform common sense check. Returning original score.", error)
    return { ...initialScore, overrideReason: null }
  }
}

function calculateFoodScore(data: ProductAnalysis): ScoreResult {
  const baseline = 50
  let score = baseline
  const adjustments: Array<{ reason: string; points: number }> = []
  const nutrients = data.nutrientsPer100g || {}

  const addAdjustment = (reason: string, points: number) => {
    if (points !== 0) {
      adjustments.push({ reason, points })
      score += points
    }
  }

  // Processing level adjustments
  switch (data.processingLevel) {
    case "Unprocessed/Minimally Processed":
      addAdjustment("NOVA Group 1", 15)
      break
    case "Processed Culinary Ingredients":
      addAdjustment("NOVA Group 2", 8)
      break
    case "Processed Foods":
      addAdjustment("NOVA Group 3", 0)
      break
    case "Ultra-Processed Foods":
      addAdjustment("NOVA Group 4", -8)
      break
  }

  // Fruit and vegetable bonus
  const fruitAndVegKeywords = [
    "apple",
    "banana",
    "orange",
    "strawberry",
    "grape",
    "avocado",
    "tomato",
    "potato",
    "carrot",
    "broccoli",
    "spinach",
    "lettuce",
    "cucumber",
    "pepper",
    "onion",
    "garlic",
    "mango",
    "pineapple",
    "blueberry",
    "raspberry",
    "kale",
    "celery",
  ]
  const productNameLower = data.productName?.toLowerCase() || ""
  if (
    data.processingLevel === "Unprocessed/Minimally Processed" &&
    fruitAndVegKeywords.some((keyword) => productNameLower.includes(keyword))
  ) {
    addAdjustment("Whole Fruit/Vegetable", 5)
  }

  // Positive modifiers
  let positivePoints = 0
  const fiber = nutrients.fiberG ?? 0
  if (fiber >= 6) positivePoints += 8
  else if (fiber >= 3) positivePoints += 5
  else if (fiber >= 1.5) positivePoints += 3

  const unsatFat = nutrients.unsaturatedFatG ?? 0
  const satFat = nutrients.saturatedFatG ?? 0
  if (satFat > 0) {
    const ratio = unsatFat / satFat
    if (ratio >= 2.0) positivePoints += 5
    else if (ratio >= 1.0) positivePoints += 3
  } else if (unsatFat > 0) {
    positivePoints += 3
  }

  if (data.proteinQuality === "High-Quality Whole-Food") positivePoints += 5
  else if (data.proteinQuality === "High-Quality Plant-Based") positivePoints += 3

  if ((data.wholeFoodContentPercentage ?? 0) >= 40) positivePoints += 3

  addAdjustment("Positive Modifiers", Math.min(20, positivePoints))

  // Negative modifiers
  let negativePoints = 0
  const sugar = nutrients.addedSugarG ?? 0
  if (sugar > 22.5) negativePoints += 20
  else if (sugar >= 15) negativePoints += 15
  else if (sugar >= 5) negativePoints += 10
  else if (sugar > 0) negativePoints += 5

  const sodium = nutrients.sodiumMg ?? 0
  if (sodium >= 600) negativePoints += 8
  else if (sodium >= 300) negativePoints += 5
  else if (sodium >= 120) negativePoints += 3

  if (data.hasTransFat) negativePoints += 5

  let additivePenalty = 0
  if (data.harmfulAdditives?.hasArtificialSweeteners) additivePenalty += 3
  if (data.harmfulAdditives?.hasIndustrialEmulsifiers) additivePenalty += 3
  if (data.harmfulAdditives?.hasArtificialColorsFlavors) additivePenalty += 3
  negativePoints += Math.min(5, additivePenalty)

  addAdjustment("Negative Modifiers", -Math.min(30, negativePoints))

  const standardScore = Math.round(score)

  // Exceptional profile bonus for high scores
  if (standardScore >= 80) {
    let bonusPotential = 0
    const protein = nutrients.proteinG ?? 0
    if (protein > 25) bonusPotential += protein - 25
    if (fiber > 10) bonusPotential += (fiber - 10) * 1.5
    if (unsatFat > 20 && satFat < 4) bonusPotential += unsatFat - 20
    if (sugar < 1) bonusPotential += 10
    if (sodium < 50) bonusPotential += 10

    if (bonusPotential > 0) {
      const maxBonus = 19
      const scalingFactor = 40
      const bonusPoints = Math.round(maxBonus * (1 - Math.exp(-bonusPotential / scalingFactor)))
      if (bonusPoints > 0) {
        const finalExceptionalScore = 80 + bonusPoints
        const pointsToAdd = finalExceptionalScore - standardScore
        if (pointsToAdd > 0) {
          addAdjustment("Exceptional Profile", pointsToAdd)
        }
      }
    }
  }

  let finalScore = Math.max(0, Math.min(100, Math.round(score)))
  const isBestInClass = data.isBestInClass === true

  // Best in class bonus
  if (isBestInClass && finalScore < 100) {
    const bonusPoints = Math.min(10, 100 - finalScore)
    if (bonusPoints > 0) {
      addAdjustment("⭐ Best In Class", bonusPoints)
      finalScore += bonusPoints
    }
  }

  // Special case for water
  if (productNameLower.includes("water") && (!nutrients || (nutrients.addedSugarG === 0 && nutrients.sodiumMg === 0))) {
    return {
      finalScore: 100,
      isBestInClass: true,
      trustScore: data.trustScore || 99,
      category: "Excellent",
      productName: data.productName || "Water",
      breakdown: { baseScore: 100, adjustments: [] },
      healthierAddon: null,
      topInCategory: null,
      nutrients: null,
    }
  }

  // Determine category
  let category: string
  if (finalScore >= 90) category = "Excellent"
  else if (finalScore >= 70) category = "Good"
  else if (finalScore >= 50) category = "Moderate"
  else if (finalScore >= 30) category = "Limit"
  else category = "Avoid"

  return {
    finalScore,
    isBestInClass,
    trustScore: data.trustScore || 0,
    category,
    productName: data.productName || "Unknown Product",
    breakdown: { baseScore: baseline, adjustments },
    healthierAddon: data.healthierAddon || null,
    topInCategory: data.topInCategory || null,
    nutrients: data.nutrientsPer100g,
  }
}

function calculatePersonalCareScore(data: ProductAnalysis): ScoreResult {
  const baseline = 60
  const adjustments: Array<{ reason: string; points: number }> = []
  let score = baseline
  const details = data.personalCareDetails

  const addAdjustment = (reason: string, points: number) => {
    adjustments.push({ reason, points })
    score += points
  }

  if (details) {
    details.harmfulIngredients?.forEach((ing) => {
      if (/paraben/i.test(ing)) addAdjustment("Contains Parabens", -8)
      else if (/sulfate|sls|sles/i.test(ing)) addAdjustment("Contains Sulfates", -3)
      else if (/phthalate/i.test(ing)) addAdjustment("Contains Phthalates", -8)
    })

    if (details.hasFragrance) addAdjustment("Contains Synthetic Fragrance", -3)

    details.beneficialIngredients?.forEach((ing) => {
      if (/ceramide/i.test(ing)) addAdjustment("Contains Ceramides", 5)
      else if (/vitamin e|tocopherol/i.test(ing)) addAdjustment("Contains Vitamin E", 3)
    })

    if (details.isCrueltyFree) addAdjustment("Cruelty-Free", 3)
  }

  let finalScore = Math.max(0, Math.min(100, Math.round(score)))
  const isBestInClass = data.isBestInClass === true

  // Best in class bonus
  if (isBestInClass && finalScore < 100) {
    const bonusPoints = Math.min(10, 100 - finalScore)
    if (bonusPoints > 0) {
      addAdjustment("⭐ Best In Class", bonusPoints)
      finalScore += bonusPoints
    }
  }

  // Determine category
  let category: string
  if (finalScore >= 90) category = "Excellent"
  else if (finalScore >= 70) category = "Good"
  else if (finalScore >= 50) category = "Moderate"
  else if (finalScore >= 30) category = "Limit"
  else category = "Avoid"

  return {
    finalScore,
    isBestInClass,
    trustScore: data.trustScore || 0,
    category,
    productName: data.productName || "Unknown Product",
    breakdown: { baseScore: baseline, adjustments },
    healthierAddon: data.healthierAddon || null,
    topInCategory: data.topInCategory || null,
    nutrients: null,
  }
}

function calculateUltraScore(data: ProductAnalysis): ScoreResult {
  if (!data.isConsumerProduct || !data.productCategory) {
    throw new Error("Cannot calculate score for a non-consumer item.")
  }

  switch (data.productCategory) {
    case "Food":
    case "Beverage":
      return calculateFoodScore(data)
    case "PersonalCare":
      return calculatePersonalCareScore(data)
    default:
      throw new Error(`Scoring not implemented for category: ${data.productCategory}`)
  }
}

async function generateInDepthAnalysis(
  productData: ProductAnalysis,
  scoreData: ScoreResult
): Promise<InDepthAnalysis | null> {
  const API_KEY = process.env.GEMINI_API_KEY
  if (!API_KEY) return null

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent?key=${API_KEY}`

  const prompt = `You are a nutrition and health expert AI. Provide an in-depth analysis for the product "${productData.productName}" which scored ${scoreData.finalScore}/100.

Product details:
- Category: ${productData.productCategory}
- Processing Level: ${productData.processingLevel}
- Nutrients per 100g: ${JSON.stringify(productData.nutrientsPer100g)}
- Has Trans Fat: ${productData.hasTransFat}
- Harmful Additives: ${JSON.stringify(productData.harmfulAdditives)}

Respond ONLY with valid JSON in this format:
{
  "healthImpact": {
    "shortTerm": ["Effect 1", "Effect 2"],
    "longTerm": ["Effect 1", "Effect 2"],
    "benefits": ["Benefit 1", "Benefit 2"],
    "concerns": ["Concern 1", "Concern 2"]
  },
  "ingredientBreakdown": [
    {
      "name": "Ingredient name",
      "purpose": "Why it's in the product",
      "safetyRating": "Safe" | "Generally Safe" | "Use Caution" | "Avoid",
      "details": "More information about this ingredient"
    }
  ],
  "comparisonToAlternatives": [
    {
      "productName": "Alternative product",
      "score": 85,
      "keyDifference": "Why this alternative is better/worse"
    }
  ],
  "personalizedAdvice": "Specific advice for consuming this product",
  "scientificSources": ["Source 1", "Source 2"]
}

Provide honest, scientifically-backed analysis. Include 3-5 key ingredients and 2-3 alternatives.`

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return JSON.parse(data.candidates[0].content.parts[0].text)
  } catch (error) {
    console.error("In-depth analysis error:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for authenticated user
    const session = await getServerSession(authOptions)
    let user = null
    let isPaidUser = false

    if (session?.user?.email) {
      user = await getUserByEmail(session.user.email)
      isPaidUser = user?.planId === "pro" || user?.planId === "premium"
    }

    const clientIP = getClientIP(request)
    const rateLimitResult = await checkRateLimit(clientIP)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Your ${rateLimitResult.planName || "current"} plan allows ${rateLimitResult.limit} scans per day.`,
          rateLimitInfo: {
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            reset: rateLimitResult.reset,
            planName: rateLimitResult.planName,
          },
          upgradeRequired: rateLimitResult.planName === "Free",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      )
    }

    const { term, image, requestInDepth } = await request.json()

    if (!term || typeof term !== "string") {
      return NextResponse.json({ error: "Product term is required" }, { status: 400 })
    }

    // Analyze the product with Gemini
    const analysis = await analyzeProductWithGemini(term, image)

    // Calculate the initial score
    const initialScoreObject = calculateUltraScore(analysis)

    // Perform common sense check
    let finalScoreData = await performCommonSenseCheck(analysis, initialScoreObject)

    // Generate in-depth analysis for paid users
    if (isPaidUser && requestInDepth) {
      const inDepthAnalysis = await generateInDepthAnalysis(analysis, finalScoreData)
      finalScoreData = { ...finalScoreData, inDepthAnalysis }
    }

    // Save scan to history for logged-in users
    if (user) {
      try {
        await addScanToHistory(user.id, {
          productName: finalScoreData.productName,
          score: finalScoreData.finalScore,
          category: finalScoreData.category,
          nutrients: finalScoreData.nutrients,
          breakdown: finalScoreData.breakdown,
          healthierAddon: finalScoreData.healthierAddon,
          topInCategory: finalScoreData.topInCategory,
        })
      } catch (historyError) {
        console.error("Failed to save scan to history:", historyError)
        // Don't fail the request if history save fails
      }
    }

    const response = NextResponse.json({
      ...finalScoreData,
      trackUsage: true,
      isPaidUser,
      isLoggedIn: !!user,
    })
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())

    return response
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analysis failed" }, { status: 500 })
  }
}
