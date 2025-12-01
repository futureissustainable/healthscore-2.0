// Evidence-Based Health Scoring Engine
// NRF9.3 + NOVA Hybrid System
// Formula: Final Score = (50 + Positive_Points - Negative_Points) × Category_Modifier × Confidence_Adjustment

import {
  EVIDENCE_WEIGHTS,
  SCORE_CATEGORIES,
  NOVA_MULTIPLIERS,
  DAILY_REFERENCE,
  GLYCEMIC_LOAD_THRESHOLDS,
  ADDED_SUGAR_THRESHOLDS,
  FIBER_THRESHOLDS,
  CARB_FIBER_RATIO,
  PROTEIN_SOURCE_SCORES,
  FAT_TYPE_SCORES,
  ADDITIVE_SCORES,
  SWEETENER_SCORES,
  FERMENTED_SCORES,
  POLYPHENOL_SCORES,
  PERSONAL_CARE_PENALTIES,
  PERSONAL_CARE_BONUSES,
  BEVERAGE_BASE_SCORES,
  WARNING_FLAGS,
  ConfidenceLevel,
  ConfidenceRating
} from "./scoring-constants"

// ============================================================================
// TYPES
// ============================================================================
export interface ProductAnalysisV2 {
  isConsumerProduct: boolean
  rejectionReason?: string | null
  productName: string
  productCategory: "Food" | "Beverage" | "PersonalCare"

  // Processing classification
  processingLevel: keyof typeof NOVA_MULTIPLIERS

  // Nutrients per 100g
  nutrientsPer100g?: {
    calories: number
    protein: number
    totalFat: number
    saturatedFat: number
    unsaturatedFat: number
    transFat: number
    omega3: number
    carbohydrates: number
    fiber: number
    addedSugar: number
    sodium: number
    // Optional micronutrients
    vitaminA?: number
    vitaminC?: number
    vitaminE?: number
    calcium?: number
    iron?: number
    magnesium?: number
    potassium?: number
  }

  // Glycemic data
  glycemicLoad?: number

  // Source classifications
  proteinSources?: Array<keyof typeof PROTEIN_SOURCE_SCORES>
  fatSources?: Array<keyof typeof FAT_TYPE_SCORES>

  // Additives detected
  additives?: string[]
  sweeteners?: string[]

  // Special categories
  isFermented?: boolean
  fermentationType?: keyof typeof FERMENTED_SCORES
  hasLiveCultures?: boolean

  // Polyphenol content
  polyphenolSources?: Array<keyof typeof POLYPHENOL_SCORES>

  // Whole food percentage
  wholeFoodPercentage?: number
  fruitVegPercentage?: number

  // Personal care specific
  personalCareDetails?: {
    harmfulIngredients: string[]
    beneficialIngredients: string[]
    hasFragrance: boolean
    isCrueltyFree: boolean
    isEWGVerified?: boolean
  }

  // Beverage specific
  beverageType?: keyof typeof BEVERAGE_BASE_SCORES

  // Data quality
  dataCompleteness?: number // 0-100%
}

export interface ScoreBreakdown {
  baseScore: number
  positivePoints: number
  negativePoints: number
  novaMultiplier: number
  confidenceAdjustment: number
  adjustments: Array<{
    category: string
    reason: string
    points: number
    evidenceWeight: number
  }>
}

export interface ScoringResult {
  finalScore: number
  category: string
  grade: string
  productName: string
  breakdown: ScoreBreakdown
  confidence: ConfidenceRating
  warnings: string[]
  nutrients?: any
  healthierAlternative?: {
    productName: string
    description: string
    estimatedScore: number
  } | null
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================
export function calculateHealthScore(data: ProductAnalysisV2): ScoringResult {
  if (!data.isConsumerProduct) {
    throw new Error(data.rejectionReason || "Not a consumer product")
  }

  switch (data.productCategory) {
    case "Food":
      return calculateFoodScoreV2(data)
    case "Beverage":
      return calculateBeverageScore(data)
    case "PersonalCare":
      return calculatePersonalCareScoreV2(data)
    default:
      throw new Error(`Unknown category: ${data.productCategory}`)
  }
}

// ============================================================================
// FOOD SCORING (NRF9.3 + NOVA)
// ============================================================================
function calculateFoodScoreV2(data: ProductAnalysisV2): ScoringResult {
  const adjustments: ScoreBreakdown["adjustments"] = []
  const warnings: string[] = []
  let positivePoints = 0
  let negativePoints = 0

  const nutrients = data.nutrientsPer100g || {
    calories: 100, protein: 0, totalFat: 0, saturatedFat: 0,
    unsaturatedFat: 0, transFat: 0, omega3: 0, carbohydrates: 0,
    fiber: 0, addedSugar: 0, sodium: 0
  }

  // Track data completeness
  let dataFields = 0
  let presentFields = 0

  // -------------------------------------------------------------------------
  // POSITIVE MODIFIERS (NRF9.3 nutrients to encourage)
  // -------------------------------------------------------------------------

  // Fiber (Strong evidence - 1.0x weight)
  dataFields++
  if (nutrients.fiber !== undefined) {
    presentFields++
    const fiberPct = Math.min(100, (nutrients.fiber / DAILY_REFERENCE.fiber.dv) * 100)
    const fiberPoints = (fiberPct / 100) * DAILY_REFERENCE.fiber.maxPoints * EVIDENCE_WEIGHTS.STRONG
    if (fiberPoints > 0) {
      positivePoints += fiberPoints
      adjustments.push({
        category: "Fiber",
        reason: `${nutrients.fiber.toFixed(1)}g fiber (${fiberPct.toFixed(0)}% DV)`,
        points: fiberPoints,
        evidenceWeight: EVIDENCE_WEIGHTS.STRONG
      })
    }
  } else {
    warnings.push(WARNING_FLAGS.MISSING_FIBER)
  }

  // Protein (Strong evidence - 1.0x weight)
  dataFields++
  if (nutrients.protein !== undefined) {
    presentFields++
    const proteinPct = Math.min(100, (nutrients.protein / DAILY_REFERENCE.protein.dv) * 100)
    const proteinPoints = (proteinPct / 100) * DAILY_REFERENCE.protein.maxPoints * EVIDENCE_WEIGHTS.STRONG
    if (proteinPoints > 0) {
      positivePoints += proteinPoints
      adjustments.push({
        category: "Protein",
        reason: `${nutrients.protein.toFixed(1)}g protein`,
        points: proteinPoints,
        evidenceWeight: EVIDENCE_WEIGHTS.STRONG
      })
    }
  }

  // Protein source modifier (Moderate evidence - 0.75x weight)
  if (data.proteinSources && data.proteinSources.length > 0) {
    let sourceScore = 0
    data.proteinSources.forEach(source => {
      const score = PROTEIN_SOURCE_SCORES[source] || 0
      sourceScore += score * EVIDENCE_WEIGHTS.MODERATE
    })
    sourceScore = sourceScore / data.proteinSources.length // Average

    if (sourceScore !== 0) {
      if (sourceScore > 0) positivePoints += sourceScore
      else negativePoints += Math.abs(sourceScore)

      adjustments.push({
        category: "Protein Source",
        reason: `${data.proteinSources.join(", ")}`,
        points: sourceScore,
        evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
      })
    }

    // Warning for processed meat
    if (data.proteinSources.includes("processed_meat")) {
      warnings.push(WARNING_FLAGS.PROCESSED_MEAT)
    }
  }

  // Fruit/Vegetable percentage (Strong evidence - 1.0x weight)
  if (data.fruitVegPercentage && data.fruitVegPercentage > 0) {
    const fvPoints = Math.min(10, data.fruitVegPercentage / 10) * EVIDENCE_WEIGHTS.STRONG
    positivePoints += fvPoints
    adjustments.push({
      category: "Fruits & Vegetables",
      reason: `${data.fruitVegPercentage}% fruit/vegetable content`,
      points: fvPoints,
      evidenceWeight: EVIDENCE_WEIGHTS.STRONG
    })
  }

  // Healthy fats - Omega-3 (Strong evidence)
  if (nutrients.omega3 && nutrients.omega3 > 0) {
    const omega3Points = Math.min(3, nutrients.omega3 / 0.25) * EVIDENCE_WEIGHTS.STRONG
    positivePoints += omega3Points
    adjustments.push({
      category: "Omega-3",
      reason: `${(nutrients.omega3 * 1000).toFixed(0)}mg omega-3`,
      points: omega3Points,
      evidenceWeight: EVIDENCE_WEIGHTS.STRONG
    })
  }

  // Fat source modifiers (Moderate evidence)
  if (data.fatSources && data.fatSources.length > 0) {
    let fatSourceScore = 0
    data.fatSources.forEach(source => {
      fatSourceScore += (FAT_TYPE_SCORES[source] || 0) * EVIDENCE_WEIGHTS.MODERATE
    })
    fatSourceScore = fatSourceScore / data.fatSources.length

    if (fatSourceScore !== 0) {
      if (fatSourceScore > 0) positivePoints += fatSourceScore
      else negativePoints += Math.abs(fatSourceScore)

      adjustments.push({
        category: "Fat Sources",
        reason: `${data.fatSources.join(", ")}`,
        points: fatSourceScore,
        evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
      })
    }
  }

  // Fermented food bonus (Moderate evidence - Stanford 2021)
  if (data.isFermented && data.hasLiveCultures && data.fermentationType) {
    const fermentedScore = FERMENTED_SCORES[data.fermentationType]
    if (fermentedScore && fermentedScore.hasLiveCultures) {
      const bonus = fermentedScore.score * EVIDENCE_WEIGHTS.MODERATE
      positivePoints += bonus
      adjustments.push({
        category: "Fermented",
        reason: `Live culture ${data.fermentationType}`,
        points: bonus,
        evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
      })
    }
  }

  // Polyphenols (Emerging evidence - 0.5x weight)
  if (data.polyphenolSources && data.polyphenolSources.length > 0) {
    let polyScore = 0
    data.polyphenolSources.forEach(source => {
      const info = POLYPHENOL_SCORES[source]
      if (info) {
        polyScore += info.score * EVIDENCE_WEIGHTS.EMERGING
      }
    })
    if (polyScore > 0) {
      positivePoints += Math.min(5, polyScore) // Cap at 5
      adjustments.push({
        category: "Polyphenols",
        reason: `Contains ${data.polyphenolSources.join(", ")}`,
        points: Math.min(5, polyScore),
        evidenceWeight: EVIDENCE_WEIGHTS.EMERGING
      })
    }
  }

  // -------------------------------------------------------------------------
  // NEGATIVE MODIFIERS (NRF9.3 nutrients to limit)
  // -------------------------------------------------------------------------

  // Saturated Fat (Strong evidence - 1.0x weight)
  dataFields++
  if (nutrients.saturatedFat !== undefined) {
    presentFields++
    const satFatPct = (nutrients.saturatedFat / DAILY_REFERENCE.saturatedFat.limit) * 100
    if (satFatPct > 0) {
      const penalty = Math.min(
        DAILY_REFERENCE.saturatedFat.maxPenalty,
        (satFatPct / 100) * DAILY_REFERENCE.saturatedFat.maxPenalty
      ) * EVIDENCE_WEIGHTS.STRONG
      negativePoints += penalty
      adjustments.push({
        category: "Saturated Fat",
        reason: `${nutrients.saturatedFat.toFixed(1)}g saturated fat`,
        points: -penalty,
        evidenceWeight: EVIDENCE_WEIGHTS.STRONG
      })
    }
  }

  // Added Sugar (Strong evidence - 1.0x weight)
  dataFields++
  if (nutrients.addedSugar !== undefined) {
    presentFields++
    const sugarPct = (nutrients.addedSugar / DAILY_REFERENCE.addedSugar.limit) * 100
    if (sugarPct > 0) {
      const penalty = Math.min(
        DAILY_REFERENCE.addedSugar.maxPenalty,
        (sugarPct / 100) * DAILY_REFERENCE.addedSugar.maxPenalty
      ) * EVIDENCE_WEIGHTS.STRONG
      negativePoints += penalty
      adjustments.push({
        category: "Added Sugar",
        reason: `${nutrients.addedSugar.toFixed(1)}g added sugar`,
        points: -penalty,
        evidenceWeight: EVIDENCE_WEIGHTS.STRONG
      })
    }
  }

  // Sodium (Strong evidence - 1.0x weight)
  dataFields++
  if (nutrients.sodium !== undefined) {
    presentFields++
    const sodiumPct = (nutrients.sodium / DAILY_REFERENCE.sodium.limit) * 100
    if (sodiumPct > 20) { // Only penalize if significant
      const penalty = Math.min(
        DAILY_REFERENCE.sodium.maxPenalty,
        (sodiumPct / 100) * DAILY_REFERENCE.sodium.maxPenalty
      ) * EVIDENCE_WEIGHTS.STRONG
      negativePoints += penalty
      adjustments.push({
        category: "Sodium",
        reason: `${nutrients.sodium.toFixed(0)}mg sodium`,
        points: -penalty,
        evidenceWeight: EVIDENCE_WEIGHTS.STRONG
      })
    }
  }

  // Trans Fat (Strong evidence - severe penalty)
  dataFields++
  if (nutrients.transFat !== undefined && nutrients.transFat > 0) {
    presentFields++
    const penalty = Math.min(15, nutrients.transFat * 10) * EVIDENCE_WEIGHTS.STRONG
    negativePoints += penalty
    adjustments.push({
      category: "Trans Fat",
      reason: `${nutrients.transFat.toFixed(1)}g trans fat - AVOID`,
      points: -penalty,
      evidenceWeight: EVIDENCE_WEIGHTS.STRONG
    })
  }

  // Glycemic Load (Moderate evidence)
  if (data.glycemicLoad !== undefined) {
    if (data.glycemicLoad <= GLYCEMIC_LOAD_THRESHOLDS.low.max) {
      positivePoints += GLYCEMIC_LOAD_THRESHOLDS.low.points * EVIDENCE_WEIGHTS.MODERATE
      adjustments.push({
        category: "Glycemic Load",
        reason: `Low GL (${data.glycemicLoad})`,
        points: GLYCEMIC_LOAD_THRESHOLDS.low.points * EVIDENCE_WEIGHTS.MODERATE,
        evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
      })
    } else if (data.glycemicLoad >= GLYCEMIC_LOAD_THRESHOLDS.high.min) {
      negativePoints += Math.abs(GLYCEMIC_LOAD_THRESHOLDS.high.points) * EVIDENCE_WEIGHTS.MODERATE
      adjustments.push({
        category: "Glycemic Load",
        reason: `High GL (${data.glycemicLoad})`,
        points: GLYCEMIC_LOAD_THRESHOLDS.high.points * EVIDENCE_WEIGHTS.MODERATE,
        evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
      })
    }
  }

  // Additives (Variable evidence)
  if (data.additives && data.additives.length > 0) {
    let additiveScore = 0
    data.additives.forEach(additive => {
      const key = additive.toLowerCase().replace(/[^a-z_]/g, "_") as keyof typeof ADDITIVE_SCORES
      const info = ADDITIVE_SCORES[key]
      if (info) {
        const weight = info.confidence === "HIGH" ? EVIDENCE_WEIGHTS.STRONG :
                      info.confidence === "MODERATE" ? EVIDENCE_WEIGHTS.MODERATE :
                      EVIDENCE_WEIGHTS.CONFLICTING
        additiveScore += info.score * weight
      }
    })
    if (additiveScore !== 0) {
      if (additiveScore < 0) negativePoints += Math.abs(additiveScore)
      else positivePoints += additiveScore

      adjustments.push({
        category: "Additives",
        reason: `${data.additives.length} additives detected`,
        points: additiveScore,
        evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
      })
    }
  }

  // Artificial Sweeteners (Conflicting evidence - 0.25x weight)
  if (data.sweeteners && data.sweeteners.length > 0) {
    warnings.push(WARNING_FLAGS.ARTIFICIAL_SWEETENERS)
    let sweetenerScore = 0
    data.sweeteners.forEach(sweetener => {
      const key = sweetener.toLowerCase().replace(/[^a-z_]/g, "_") as keyof typeof SWEETENER_SCORES
      const info = SWEETENER_SCORES[key]
      if (info) {
        sweetenerScore += info.score * EVIDENCE_WEIGHTS.CONFLICTING
      }
    })
    if (sweetenerScore !== 0) {
      negativePoints += Math.abs(sweetenerScore)
      adjustments.push({
        category: "Sweeteners",
        reason: `Contains ${data.sweeteners.join(", ")} (research evolving)`,
        points: sweetenerScore,
        evidenceWeight: EVIDENCE_WEIGHTS.CONFLICTING
      })
    }

    // Special warning for erythritol/xylitol
    if (data.sweeteners.some(s => ["erythritol", "xylitol"].includes(s.toLowerCase()))) {
      warnings.push(WARNING_FLAGS.ERYTHRITOL_XYLITOL)
    }
  }

  // -------------------------------------------------------------------------
  // CALCULATE BASE SCORE
  // -------------------------------------------------------------------------
  const baseScore = 50
  let rawScore = baseScore + positivePoints - negativePoints

  // -------------------------------------------------------------------------
  // APPLY NOVA MULTIPLIER
  // -------------------------------------------------------------------------
  const novaMultiplier = NOVA_MULTIPLIERS[data.processingLevel] || 1.0
  rawScore = rawScore * novaMultiplier

  if (data.processingLevel === "Ultra-Processed Foods") {
    warnings.push(WARNING_FLAGS.ULTRA_PROCESSED)
    adjustments.push({
      category: "Processing",
      reason: `Ultra-processed (NOVA 4) - 22% penalty`,
      points: -(rawScore * 0.22),
      evidenceWeight: EVIDENCE_WEIGHTS.EMERGING
    })
  } else if (data.processingLevel === "Unprocessed/Minimally Processed") {
    adjustments.push({
      category: "Processing",
      reason: `Minimally processed (NOVA 1) - 5% bonus`,
      points: rawScore * 0.05,
      evidenceWeight: EVIDENCE_WEIGHTS.EMERGING
    })
  }

  // -------------------------------------------------------------------------
  // CONFIDENCE ADJUSTMENT
  // -------------------------------------------------------------------------
  const dataCompleteness = dataFields > 0 ? (presentFields / dataFields) * 100 : 50
  let confidenceAdjustment = 1.0
  let confidenceLevel: ConfidenceLevel = "HIGH"

  if (dataCompleteness < 50) {
    confidenceAdjustment = 0.9 // 10% uncertainty penalty
    confidenceLevel = "LOW"
    warnings.push(WARNING_FLAGS.INSUFFICIENT_DATA)
  } else if (dataCompleteness < 80) {
    confidenceAdjustment = 0.95
    confidenceLevel = "MODERATE"
  }

  rawScore = rawScore * confidenceAdjustment

  // -------------------------------------------------------------------------
  // FINAL SCORE AND CATEGORY
  // -------------------------------------------------------------------------
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)))

  let category = SCORE_CATEGORIES.AVOID.label
  let grade = SCORE_CATEGORIES.AVOID.grade

  if (finalScore >= SCORE_CATEGORIES.EXCELLENT.min) {
    category = SCORE_CATEGORIES.EXCELLENT.label
    grade = SCORE_CATEGORIES.EXCELLENT.grade
  } else if (finalScore >= SCORE_CATEGORIES.GOOD.min) {
    category = SCORE_CATEGORIES.GOOD.label
    grade = SCORE_CATEGORIES.GOOD.grade
  } else if (finalScore >= SCORE_CATEGORIES.MODERATE.min) {
    category = SCORE_CATEGORIES.MODERATE.label
    grade = SCORE_CATEGORIES.MODERATE.grade
  } else if (finalScore >= SCORE_CATEGORIES.POOR.min) {
    category = SCORE_CATEGORIES.POOR.label
    grade = SCORE_CATEGORIES.POOR.grade
  }

  return {
    finalScore,
    category,
    grade,
    productName: data.productName,
    breakdown: {
      baseScore,
      positivePoints,
      negativePoints,
      novaMultiplier,
      confidenceAdjustment,
      adjustments
    },
    confidence: {
      level: confidenceLevel,
      dataCompleteness,
      message: confidenceLevel === "LOW" ? "Limited nutritional data available" : undefined
    },
    warnings,
    nutrients: data.nutrientsPer100g,
    healthierAlternative: null
  }
}

// ============================================================================
// BEVERAGE SCORING
// ============================================================================
function calculateBeverageScore(data: ProductAnalysisV2): ScoringResult {
  const adjustments: ScoreBreakdown["adjustments"] = []
  const warnings: string[] = []

  // Start with beverage type base score
  let baseScore = data.beverageType ?
    BEVERAGE_BASE_SCORES[data.beverageType] || 50 : 50

  let positivePoints = 0
  let negativePoints = 0

  const nutrients = data.nutrientsPer100g

  // Apply nutrient modifiers
  if (nutrients) {
    // Sugar penalty (major factor for beverages)
    if (nutrients.addedSugar && nutrients.addedSugar > 0) {
      const sugarPenalty = Math.min(40, nutrients.addedSugar * 3)
      negativePoints += sugarPenalty
      adjustments.push({
        category: "Added Sugar",
        reason: `${nutrients.addedSugar.toFixed(1)}g sugar per 100ml`,
        points: -sugarPenalty,
        evidenceWeight: EVIDENCE_WEIGHTS.STRONG
      })
    }

    // Artificial sweeteners
    if (data.sweeteners && data.sweeteners.length > 0) {
      warnings.push(WARNING_FLAGS.ARTIFICIAL_SWEETENERS)
      negativePoints += 5 * EVIDENCE_WEIGHTS.CONFLICTING
      adjustments.push({
        category: "Sweeteners",
        reason: `Contains artificial sweeteners`,
        points: -5 * EVIDENCE_WEIGHTS.CONFLICTING,
        evidenceWeight: EVIDENCE_WEIGHTS.CONFLICTING
      })
    }

    // Caffeine (context-dependent - not a penalty)
    // Beneficial nutrients
    if (nutrients.potassium && nutrients.potassium > 100) {
      positivePoints += 2
      adjustments.push({
        category: "Electrolytes",
        reason: `Contains potassium`,
        points: 2,
        evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
      })
    }
  }

  // NOVA modifier for beverages
  const novaMultiplier = NOVA_MULTIPLIERS[data.processingLevel] || 1.0

  let rawScore = (baseScore + positivePoints - negativePoints) * novaMultiplier
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)))

  let category = SCORE_CATEGORIES.AVOID.label
  let grade = SCORE_CATEGORIES.AVOID.grade

  if (finalScore >= SCORE_CATEGORIES.EXCELLENT.min) {
    category = SCORE_CATEGORIES.EXCELLENT.label
    grade = SCORE_CATEGORIES.EXCELLENT.grade
  } else if (finalScore >= SCORE_CATEGORIES.GOOD.min) {
    category = SCORE_CATEGORIES.GOOD.label
    grade = SCORE_CATEGORIES.GOOD.grade
  } else if (finalScore >= SCORE_CATEGORIES.MODERATE.min) {
    category = SCORE_CATEGORIES.MODERATE.label
    grade = SCORE_CATEGORIES.MODERATE.grade
  } else if (finalScore >= SCORE_CATEGORIES.POOR.min) {
    category = SCORE_CATEGORIES.POOR.label
    grade = SCORE_CATEGORIES.POOR.grade
  }

  return {
    finalScore,
    category,
    grade,
    productName: data.productName,
    breakdown: {
      baseScore,
      positivePoints,
      negativePoints,
      novaMultiplier,
      confidenceAdjustment: 1.0,
      adjustments
    },
    confidence: {
      level: "HIGH",
      dataCompleteness: 80
    },
    warnings,
    nutrients: data.nutrientsPer100g,
    healthierAlternative: null
  }
}

// ============================================================================
// PERSONAL CARE SCORING
// ============================================================================
function calculatePersonalCareScoreV2(data: ProductAnalysisV2): ScoringResult {
  const adjustments: ScoreBreakdown["adjustments"] = []
  const warnings: string[] = []

  const baseScore = 70 // Higher base for personal care
  let positivePoints = 0
  let negativePoints = 0

  const details = data.personalCareDetails

  if (details) {
    // Harmful ingredients
    details.harmfulIngredients.forEach(ingredient => {
      const lowerIng = ingredient.toLowerCase()

      if (/paraben/i.test(lowerIng)) {
        negativePoints += Math.abs(PERSONAL_CARE_PENALTIES.parabens)
        adjustments.push({
          category: "Harmful Ingredient",
          reason: "Contains Parabens",
          points: PERSONAL_CARE_PENALTIES.parabens,
          evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
        })
      }
      if (/phthalate/i.test(lowerIng)) {
        negativePoints += Math.abs(PERSONAL_CARE_PENALTIES.phthalates)
        adjustments.push({
          category: "Harmful Ingredient",
          reason: "Contains Phthalates",
          points: PERSONAL_CARE_PENALTIES.phthalates,
          evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
        })
      }
      if (/sulfate|sls|sles/i.test(lowerIng)) {
        negativePoints += Math.abs(PERSONAL_CARE_PENALTIES.sulfates_sls_sles)
        adjustments.push({
          category: "Harsh Ingredient",
          reason: "Contains Sulfates (SLS/SLES)",
          points: PERSONAL_CARE_PENALTIES.sulfates_sls_sles,
          evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
        })
      }
      if (/formaldehyde/i.test(lowerIng)) {
        negativePoints += Math.abs(PERSONAL_CARE_PENALTIES.formaldehyde_releasers)
        adjustments.push({
          category: "Harmful Ingredient",
          reason: "Contains Formaldehyde/Releasers",
          points: PERSONAL_CARE_PENALTIES.formaldehyde_releasers,
          evidenceWeight: EVIDENCE_WEIGHTS.HIGH
        })
      }
      if (/triclosan/i.test(lowerIng)) {
        negativePoints += Math.abs(PERSONAL_CARE_PENALTIES.triclosan)
        adjustments.push({
          category: "Harmful Ingredient",
          reason: "Contains Triclosan",
          points: PERSONAL_CARE_PENALTIES.triclosan,
          evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
        })
      }
    })

    // Fragrance penalty
    if (details.hasFragrance) {
      negativePoints += Math.abs(PERSONAL_CARE_PENALTIES.synthetic_fragrance)
      adjustments.push({
        category: "Fragrance",
        reason: "Contains Synthetic Fragrance",
        points: PERSONAL_CARE_PENALTIES.synthetic_fragrance,
        evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
      })
    }

    // Beneficial ingredients
    details.beneficialIngredients.forEach(ingredient => {
      const lowerIng = ingredient.toLowerCase()

      if (/ceramide/i.test(lowerIng)) {
        positivePoints += PERSONAL_CARE_BONUSES.ceramides
        adjustments.push({
          category: "Beneficial Ingredient",
          reason: "Contains Ceramides",
          points: PERSONAL_CARE_BONUSES.ceramides,
          evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
        })
      }
      if (/vitamin e|tocopherol/i.test(lowerIng)) {
        positivePoints += PERSONAL_CARE_BONUSES.vitamin_e_tocopherol
        adjustments.push({
          category: "Beneficial Ingredient",
          reason: "Contains Vitamin E",
          points: PERSONAL_CARE_BONUSES.vitamin_e_tocopherol,
          evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
        })
      }
      if (/niacinamide/i.test(lowerIng)) {
        positivePoints += PERSONAL_CARE_BONUSES.niacinamide
        adjustments.push({
          category: "Beneficial Ingredient",
          reason: "Contains Niacinamide",
          points: PERSONAL_CARE_BONUSES.niacinamide,
          evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
        })
      }
      if (/hyaluronic/i.test(lowerIng)) {
        positivePoints += PERSONAL_CARE_BONUSES.hyaluronic_acid
        adjustments.push({
          category: "Beneficial Ingredient",
          reason: "Contains Hyaluronic Acid",
          points: PERSONAL_CARE_BONUSES.hyaluronic_acid,
          evidenceWeight: EVIDENCE_WEIGHTS.MODERATE
        })
      }
    })

    // Cruelty-free bonus
    if (details.isCrueltyFree) {
      positivePoints += PERSONAL_CARE_BONUSES.cruelty_free
      adjustments.push({
        category: "Ethics",
        reason: "Cruelty-Free",
        points: PERSONAL_CARE_BONUSES.cruelty_free,
        evidenceWeight: EVIDENCE_WEIGHTS.STRONG
      })
    }

    // EWG Verified bonus
    if (details.isEWGVerified) {
      positivePoints += PERSONAL_CARE_BONUSES.ewg_verified
      adjustments.push({
        category: "Certification",
        reason: "EWG Verified",
        points: PERSONAL_CARE_BONUSES.ewg_verified,
        evidenceWeight: EVIDENCE_WEIGHTS.STRONG
      })
    }
  }

  const rawScore = baseScore + positivePoints - negativePoints
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)))

  let category = SCORE_CATEGORIES.AVOID.label
  let grade = SCORE_CATEGORIES.AVOID.grade

  if (finalScore >= SCORE_CATEGORIES.EXCELLENT.min) {
    category = SCORE_CATEGORIES.EXCELLENT.label
    grade = SCORE_CATEGORIES.EXCELLENT.grade
  } else if (finalScore >= SCORE_CATEGORIES.GOOD.min) {
    category = SCORE_CATEGORIES.GOOD.label
    grade = SCORE_CATEGORIES.GOOD.grade
  } else if (finalScore >= SCORE_CATEGORIES.MODERATE.min) {
    category = SCORE_CATEGORIES.MODERATE.label
    grade = SCORE_CATEGORIES.MODERATE.grade
  } else if (finalScore >= SCORE_CATEGORIES.POOR.min) {
    category = SCORE_CATEGORIES.POOR.label
    grade = SCORE_CATEGORIES.POOR.grade
  }

  return {
    finalScore,
    category,
    grade,
    productName: data.productName,
    breakdown: {
      baseScore,
      positivePoints,
      negativePoints,
      novaMultiplier: 1.0,
      confidenceAdjustment: 1.0,
      adjustments
    },
    confidence: {
      level: "MODERATE",
      dataCompleteness: 70
    },
    warnings,
    nutrients: null,
    healthierAlternative: null
  }
}

// ============================================================================
// HELPER: Get category from score
// ============================================================================
export function getCategoryFromScore(score: number): { category: string; grade: string } {
  if (score >= SCORE_CATEGORIES.EXCELLENT.min) {
    return { category: SCORE_CATEGORIES.EXCELLENT.label, grade: SCORE_CATEGORIES.EXCELLENT.grade }
  } else if (score >= SCORE_CATEGORIES.GOOD.min) {
    return { category: SCORE_CATEGORIES.GOOD.label, grade: SCORE_CATEGORIES.GOOD.grade }
  } else if (score >= SCORE_CATEGORIES.MODERATE.min) {
    return { category: SCORE_CATEGORIES.MODERATE.label, grade: SCORE_CATEGORIES.MODERATE.grade }
  } else if (score >= SCORE_CATEGORIES.POOR.min) {
    return { category: SCORE_CATEGORIES.POOR.label, grade: SCORE_CATEGORIES.POOR.grade }
  }
  return { category: SCORE_CATEGORIES.AVOID.label, grade: SCORE_CATEGORIES.AVOID.grade }
}
