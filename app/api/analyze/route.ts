import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { authOptions, getUserByEmail } from "@/lib/auth"
import { addScanToHistory } from "@/lib/db"
import {
  calculateHealthScore,
  ProductAnalysisV2,
  ScoringResult,
  getCategoryFromScore
} from "@/lib/scoring-engine"
import { WARNING_FLAGS } from "@/lib/scoring-constants"

// ============================================================================
// TYPES
// ============================================================================
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

// ============================================================================
// AI PROMPT FOR PRODUCT ANALYSIS
// ============================================================================
const ANALYSIS_PROMPT = `You are HEALTHSCORE, an evidence-based product analyzer using the NRF9.3 + NOVA hybrid system. Analyze the product and respond ONLY with valid JSON in this exact format:

{
  "isConsumerProduct": boolean,
  "rejectionReason": string | null,
  "productName": string,
  "productCategory": "Food" | "Beverage" | "PersonalCare",

  "processingLevel": "Unprocessed/Minimally Processed" | "Processed Culinary Ingredients" | "Processed Foods" | "Ultra-Processed Foods",

  "nutrientsPer100g": {
    "calories": number,
    "protein": number,
    "totalFat": number,
    "saturatedFat": number,
    "unsaturatedFat": number,
    "transFat": number,
    "omega3": number,
    "carbohydrates": number,
    "fiber": number,
    "addedSugar": number,
    "sodium": number,
    "vitaminA": number | null,
    "vitaminC": number | null,
    "vitaminE": number | null,
    "calcium": number | null,
    "iron": number | null,
    "magnesium": number | null,
    "potassium": number | null
  },

  "glycemicLoad": number | null,

  "proteinSources": ["fatty_fish" | "legumes" | "nuts_seeds" | "tofu_tempeh" | "greek_yogurt" | "poultry" | "eggs" | "whey_protein" | "unprocessed_red_meat" | "processed_meat"] | null,

  "fatSources": ["omega3_epa_dha" | "extra_virgin_olive_oil" | "omega3_ala" | "mufa_other" | "pufa_seed_oils" | "whole_egg_fat" | "dairy_fat" | "coconut_oil" | "butter" | "meat_saturated_fat" | "industrial_trans_fat" | "natural_trans_fat"] | null,

  "additives": string[] | null,
  "sweeteners": ["stevia" | "erythritol" | "xylitol" | "aspartame" | "sucralose" | "saccharin" | "acesulfame_k"] | null,

  "isFermented": boolean,
  "fermentationType": "kefir" | "kimchi" | "natto" | "sauerkraut_raw" | "miso_unpasteurized" | "greek_yogurt" | "kombucha" | "sourdough" | "pasteurized_fermented" | null,
  "hasLiveCultures": boolean,

  "polyphenolSources": ["sulforaphane" | "flavanols" | "anthocyanins" | "egcg" | "lycopene" | "resveratrol" | "quercetin" | "curcumin"] | null,

  "wholeFoodPercentage": number,
  "fruitVegPercentage": number,

  "beverageType": "water" | "mineral_water" | "sparkling_water" | "herbal_tea" | "green_tea" | "black_coffee" | "coconut_water" | "diet_soda" | "sports_drink" | "fruit_juice" | "soda" | "energy_drink" | null,

  "personalCareDetails": {
    "harmfulIngredients": string[],
    "beneficialIngredients": string[],
    "hasFragrance": boolean,
    "isCrueltyFree": boolean,
    "isEWGVerified": boolean
  } | null,

  "healthierAlternative": {
    "productName": string,
    "description": string,
    "estimatedScore": number
  } | null,

  "dataCompleteness": number
}

IMPORTANT GUIDELINES:
1. Use NOVA classification accurately:
   - Group 1 (Unprocessed): Fresh fruits, vegetables, eggs, plain meat, fish, milk
   - Group 2 (Culinary): Oils, butter, sugar, salt, flour
   - Group 3 (Processed): Canned vegetables, cheese, cured meats, fresh bread
   - Group 4 (Ultra-Processed): Soft drinks, packaged snacks, instant noodles, reconstituted meat

2. Be accurate with nutrient data - use per 100g values
3. Identify protein and fat sources from ingredient list
4. Detect additives: artificial colors, preservatives, emulsifiers, sweeteners
5. For beverages, classify the type appropriately
6. dataCompleteness should reflect how much nutritional info you could determine (0-100)

Analyze the product objectively based on scientific evidence.`

// ============================================================================
// ANALYZE PRODUCT WITH GEMINI
// ============================================================================
async function analyzeProductWithGemini(
  textInput: string,
  base64Image?: string
): Promise<ProductAnalysisV2> {
  console.log("[v0] Checking GEMINI_API_KEY availability...")

  const API_KEY = process.env.GEMINI_API_KEY
  if (!API_KEY) {
    console.error("[v0] GEMINI_API_KEY is undefined or empty")
    throw new Error("Gemini API key not configured")
  }

  console.log("[v0] GEMINI_API_KEY found, length:", API_KEY.length)

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`

  const requestBody: any = {
    contents: [{
      parts: [
        { text: ANALYSIS_PROMPT },
        { text: `Product to analyze: ${textInput}` }
      ]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1
    }
  }

  if (base64Image) {
    requestBody.contents[0].parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: base64Image
      }
    })
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    let errorMessage = `AI API request failed: ${response.status} ${response.statusText}`
    try {
      const errorBody = await response.json()
      console.error("Gemini API Error:", errorBody)
      errorMessage = `AI API request failed: ${errorBody.error?.message || response.statusText}`
    } catch (parseError) {
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
    console.log("[v0] Raw AI response:", jsonString.substring(0, 300) + "...")

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

    return parsedJson as ProductAnalysisV2
  } catch (e) {
    console.error("Failed to process AI response:", e)
    if (e instanceof Error && e.message.includes("consumer product")) {
      throw e
    }
    throw new Error("AI analysis failed. Please try again with a different product.")
  }
}

// ============================================================================
// COMMON SENSE SAFETY CHECK
// ============================================================================
async function performCommonSenseCheck(
  productData: ProductAnalysisV2,
  initialScore: ScoringResult
): Promise<ScoringResult> {
  // Skip check for low scores
  if (initialScore.finalScore < 20) {
    return initialScore
  }

  const API_KEY = process.env.GEMINI_API_KEY
  if (!API_KEY) {
    console.warn("Gemini API key not configured for common sense check")
    return initialScore
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`

  const prompt = `You are a safety validation AI. Your task is to identify dangerously misleading health scores.

Product Name: "${productData.productName}"
Initial Score: ${initialScore.finalScore}/100
Category: ${productData.productCategory}

Task: Evaluate if this score is absurd or dangerous. Examples of problems:
- Toxic/poisonous items scoring high (e.g., "Cyanide Water" at 100)
- Non-food items being scored as food
- Known dangerous products with high scores

Response Format (JSON only):
If score is reasonable: {"isMisleading": false}
If dangerous/absurd: {"isMisleading": true, "correctedScore": 0, "reason": "Brief explanation"}

Only override for clear, unambiguous cases of danger. Do NOT override just because a product is unhealthy - that's what low scores are for.`

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.0 }
      })
    })

    if (!response.ok) {
      console.warn("Common sense check failed, returning original score.")
      return initialScore
    }

    const data = await response.json()
    const validation = JSON.parse(data.candidates[0].content.parts[0].text)

    if (validation.isMisleading) {
      console.warn(`Safety override for "${productData.productName}". Reason: ${validation.reason}`)
      return {
        ...initialScore,
        finalScore: validation.correctedScore,
        category: "Avoid",
        grade: "F",
        warnings: [...initialScore.warnings, `Safety Override: ${validation.reason}`],
        breakdown: {
          ...initialScore.breakdown,
          adjustments: [
            ...initialScore.breakdown.adjustments,
            {
              category: "Safety Override",
              reason: validation.reason,
              points: -100,
              evidenceWeight: 1.0
            }
          ]
        }
      }
    }

    return initialScore
  } catch (error) {
    console.warn("Failed to perform common sense check:", error)
    return initialScore
  }
}

// ============================================================================
// GENERATE IN-DEPTH ANALYSIS (For paid users)
// ============================================================================
async function generateInDepthAnalysis(
  productData: ProductAnalysisV2,
  scoreData: ScoringResult
): Promise<InDepthAnalysis | null> {
  const API_KEY = process.env.GEMINI_API_KEY
  if (!API_KEY) return null

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`

  const prompt = `You are a nutrition and health expert AI providing in-depth analysis using evidence-based research.

Product: "${productData.productName}"
Score: ${scoreData.finalScore}/100 (${scoreData.category})
Category: ${productData.productCategory}
Processing Level: ${productData.processingLevel}
Key Warnings: ${scoreData.warnings.join(", ") || "None"}

Provide detailed analysis in this JSON format:
{
  "healthImpact": {
    "shortTerm": ["Immediate effects from consuming this product"],
    "longTerm": ["Effects of regular consumption over months/years"],
    "benefits": ["Positive health aspects"],
    "concerns": ["Potential health risks"]
  },
  "ingredientBreakdown": [
    {
      "name": "Ingredient name",
      "purpose": "Why it's in the product",
      "safetyRating": "Safe" | "Generally Safe" | "Use Caution" | "Avoid",
      "details": "Scientific information about this ingredient"
    }
  ],
  "comparisonToAlternatives": [
    {
      "productName": "Healthier alternative",
      "score": 85,
      "keyDifference": "Why this alternative is better"
    }
  ],
  "personalizedAdvice": "Specific, actionable advice for consuming this product",
  "scientificSources": ["Reference 1", "Reference 2"]
}

Requirements:
- Be scientifically accurate and cite real research when possible
- Include 3-5 key ingredients in breakdown
- Suggest 2-3 realistic alternatives with estimated scores
- Provide honest, balanced assessment`

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
      })
    })

    if (!response.ok) return null

    const data = await response.json()
    return JSON.parse(data.candidates[0].content.parts[0].text)
  } catch (error) {
    console.error("In-depth analysis error:", error)
    return null
  }
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================
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

    // Rate limiting
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
            planName: rateLimitResult.planName
          },
          upgradeRequired: rateLimitResult.planName === "Free"
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString()
          }
        }
      )
    }

    const { term, image, requestInDepth } = await request.json()

    if (!term || typeof term !== "string") {
      return NextResponse.json({ error: "Product term is required" }, { status: 400 })
    }

    // Step 1: Analyze the product with AI
    const analysis = await analyzeProductWithGemini(term, image)

    // Step 2: Calculate score using new NRF9.3 + NOVA system
    let scoreResult = calculateHealthScore(analysis)

    // Step 3: Perform safety check
    scoreResult = await performCommonSenseCheck(analysis, scoreResult)

    // Step 4: Generate in-depth analysis for paid users
    let inDepthAnalysis: InDepthAnalysis | null = null
    if (isPaidUser && requestInDepth) {
      inDepthAnalysis = await generateInDepthAnalysis(analysis, scoreResult)
    }

    // Step 5: Save to history for logged-in users
    if (user) {
      try {
        await addScanToHistory(user.id, {
          productName: scoreResult.productName,
          score: scoreResult.finalScore,
          category: scoreResult.category,
          nutrients: scoreResult.nutrients,
          breakdown: scoreResult.breakdown,
          healthierAddon: scoreResult.healthierAlternative,
          topInCategory: null
        })
      } catch (historyError) {
        console.error("Failed to save scan to history:", historyError)
      }
    }

    // Build response
    const responseData = {
      finalScore: scoreResult.finalScore,
      category: scoreResult.category,
      grade: scoreResult.grade,
      productName: scoreResult.productName,
      breakdown: scoreResult.breakdown,
      confidence: scoreResult.confidence,
      warnings: scoreResult.warnings,
      nutrients: scoreResult.nutrients,
      healthierAlternative: analysis.healthierAlternative || scoreResult.healthierAlternative,
      processingLevel: analysis.processingLevel,
      inDepthAnalysis,
      trackUsage: true,
      isPaidUser,
      isLoggedIn: !!user,
      // Legacy compatibility fields
      isBestInClass: scoreResult.finalScore >= 90,
      trustScore: scoreResult.confidence.dataCompleteness
    }

    const response = NextResponse.json(responseData)
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())

    return response
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    )
  }
}
