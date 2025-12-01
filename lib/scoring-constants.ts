// Evidence-Based Health Scoring Constants
// Based on NRF9.3 + NOVA hybrid system with GRADE-framework evidence weighting

// ============================================================================
// EVIDENCE WEIGHTS (GRADE Framework)
// ============================================================================
export const EVIDENCE_WEIGHTS = {
  STRONG: 1.0,      // Cochrane reviews, large RCTs (saturated fat, added sugars, fiber)
  MODERATE: 0.75,   // Protein quality, omega ratios, whole grains
  EMERGING: 0.5,    // Ultra-processing effects, specific polyphenols
  CONFLICTING: 0.25 // Artificial sweeteners, some additives
} as const

// ============================================================================
// SCORE CATEGORIES (0-100 scale)
// ============================================================================
export const SCORE_CATEGORIES = {
  EXCELLENT: { min: 80, max: 100, label: "Excellent", grade: "A" },
  GOOD: { min: 60, max: 79, label: "Good", grade: "B" },
  MODERATE: { min: 40, max: 59, label: "Moderate", grade: "C" },
  POOR: { min: 20, max: 39, label: "Poor", grade: "D" },
  AVOID: { min: 0, max: 19, label: "Avoid", grade: "F" }
} as const

// ============================================================================
// NOVA PROCESSING MULTIPLIERS (Applied multiplicatively)
// ============================================================================
export const NOVA_MULTIPLIERS = {
  "Unprocessed/Minimally Processed": 1.05,  // Group 1 bonus
  "Processed Culinary Ingredients": 1.00,   // Group 2 neutral
  "Processed Foods": 0.92,                  // Group 3 penalty
  "Ultra-Processed Foods": 0.78             // Group 4 severe penalty (BMJ 2024)
} as const

// ============================================================================
// NRF9.3 DAILY REFERENCE VALUES (per 100 kcal scoring)
// ============================================================================
export const DAILY_REFERENCE = {
  // Nutrients to encourage
  fiber: { dv: 25, maxPoints: 10 },
  protein: { dv: 50, maxPoints: 8 },
  vitaminA: { dv: 900, maxPoints: 2, unit: "mcg" },
  vitaminC: { dv: 90, maxPoints: 2, unit: "mg" },
  vitaminE: { dv: 15, maxPoints: 2, unit: "mg" },
  calcium: { dv: 1000, maxPoints: 2, unit: "mg" },
  iron: { dv: 18, maxPoints: 2, unit: "mg" },
  magnesium: { dv: 400, maxPoints: 2, unit: "mg" },
  potassium: { dv: 4700, maxPoints: 2, unit: "mg" },
  // Max positive from nutrients: 32 points

  // Nutrients to limit
  saturatedFat: { limit: 20, maxPenalty: 15, unit: "g" },
  addedSugar: { limit: 50, maxPenalty: 20, unit: "g" },
  sodium: { limit: 2300, maxPenalty: 15, unit: "mg" },
  transFat: { limit: 0, maxPenalty: 15, unit: "g" }
  // Max negative: -65 points
} as const

// ============================================================================
// MACRONUTRIENT SCORING THRESHOLDS
// ============================================================================
export const GLYCEMIC_LOAD_THRESHOLDS = {
  low: { max: 10, points: 2 },      // Bonus
  medium: { max: 19, points: 0 },   // Neutral
  high: { min: 20, points: -2 }     // Penalty
} as const

export const ADDED_SUGAR_THRESHOLDS = {
  excellent: { max: 2, points: 1 },
  good: { max: 6, points: 0 },
  moderate: { max: 12, points: -1 },
  poor: { min: 12, points: -3 }
} as const

export const FIBER_THRESHOLDS = {
  excellent: { min: 5, points: 3 },
  good: { min: 3, points: 2 },
  low: { max: 1, points: -1 }
} as const

export const CARB_FIBER_RATIO = {
  excellent: { max: 5, points: 2 },
  good: { max: 10, points: 1 },
  poor: { min: 15, points: -1 }
} as const

// ============================================================================
// PROTEIN SOURCE SCORING (per 10g, BMJ 2020 meta-analysis)
// ============================================================================
export const PROTEIN_SOURCE_SCORES = {
  // Beneficial
  "fatty_fish": 3,           // Salmon, sardines, mackerel
  "legumes": 2.5,            // Beans, lentils, chickpeas
  "nuts_seeds": 2,           // Consistent CV benefit
  "tofu_tempeh": 2,          // Complete protein + isoflavones
  "greek_yogurt": 1,         // Protein + fermentation
  // Neutral
  "poultry": 0.5,            // Lean; no strong signal
  "eggs": 0.5,               // Reassessed; 1-3/day fine
  "whey_protein": 0.5,       // High bioavailability
  // Negative
  "unprocessed_red_meat": -1,  // Heme iron, TMAO, sat fat
  "processed_meat": -3         // IARC Group 1 carcinogen
} as const

// ============================================================================
// FAT TYPE SCORING (per 5g)
// ============================================================================
export const FAT_TYPE_SCORES = {
  // Beneficial
  "omega3_epa_dha": 3,       // Strong CV, brain, inflammation evidence
  "extra_virgin_olive_oil": 2.5,  // PREDIMED trial
  "omega3_ala": 1.5,         // Flax, chia, walnut
  "mufa_other": 1.5,         // Avocado, nuts
  // Neutral to mild positive
  "pufa_seed_oils": 0.5,     // Better than sat fat (AHA 2017)
  "whole_egg_fat": 0,        // Cholesterol fear overblown
  "dairy_fat": 0,            // Matrix effect; fermented neutral
  // Negative
  "coconut_oil": -0.5,       // Raises LDL
  "butter": -1,              // Palmitic acid dominant
  "meat_saturated_fat": -1.5,  // Palmitic + compounds
  "industrial_trans_fat": -5,  // Unambiguous harm
  "natural_trans_fat": 0     // Ruminant; CLA may be beneficial
} as const

// ============================================================================
// ADDITIVE SCORING (Evidence-based)
// ============================================================================
export const ADDITIVE_SCORES = {
  // Avoid (strong evidence of harm)
  "trans_fats": { score: -5, confidence: "HIGH", reason: "Banned for good reason" },
  "bha_bht": { score: -2, confidence: "MODERATE", reason: "Possible carcinogen" },
  "sodium_nitrite": { score: -2, confidence: "HIGH", reason: "Nitrosamine formation" },
  "titanium_dioxide": { score: -2, confidence: "MODERATE", reason: "EU banned" },
  "brominated_vegetable_oil": { score: -2, confidence: "HIGH", reason: "FDA moving to ban" },

  // Caution (moderate evidence)
  "carrageenan": { score: -1.5, confidence: "MODERATE", reason: "Gut inflammation in animal studies" },
  "polysorbate_80": { score: -1.5, confidence: "MODERATE", reason: "Microbiome disruption" },
  "artificial_colors": { score: -1, confidence: "MODERATE", reason: "Hyperactivity link" },
  "hfcs": { score: -1, confidence: "LOW", reason: "Similar to sugar metabolically" },

  // Neutral (safe despite fears)
  "msg": { score: 0, confidence: "HIGH", reason: "Safe; syndrome debunked" },
  "soy_lecithin": { score: 0, confidence: "HIGH", reason: "From whole food; fine" },
  "citric_acid": { score: 0, confidence: "HIGH", reason: "Natural; no concerns" },
  "xanthan_gum": { score: 0, confidence: "HIGH", reason: "Fiber-like; safe" },
  "guar_gum": { score: 0, confidence: "HIGH", reason: "Soluble fiber; beneficial" },

  // Beneficial
  "tocopherols": { score: 0.5, confidence: "HIGH", reason: "Vitamin E preservation" },
  "ascorbic_acid": { score: 0.5, confidence: "HIGH", reason: "Vitamin C preservative" }
} as const

// ============================================================================
// ARTIFICIAL SWEETENER SCORING (Conflicting evidence - 0.25x weight)
// ============================================================================
export const SWEETENER_SCORES = {
  "stevia": { score: -0.5, confidence: "LOW", reason: "Most neutral profile" },
  "erythritol": { score: -1, confidence: "MODERATE", reason: "Recent CV concerns" },
  "xylitol": { score: -1, confidence: "MODERATE", reason: "Recent CV concerns" },
  "aspartame": { score: 0, confidence: "LOW", reason: "FDA/EFSA maintain safety" },
  "sucralose": { score: -0.5, confidence: "LOW", reason: "Some microbiome effects" },
  "saccharin": { score: -0.5, confidence: "LOW", reason: "Limited concerns" },
  "acesulfame_k": { score: -0.5, confidence: "LOW", reason: "Limited data" }
} as const

// ============================================================================
// FERMENTED FOODS BONUS
// ============================================================================
export const FERMENTED_SCORES = {
  "kefir": { score: 3, hasLiveCultures: true },
  "kimchi": { score: 3, hasLiveCultures: true },
  "natto": { score: 3, hasLiveCultures: true },
  "sauerkraut_raw": { score: 2.5, hasLiveCultures: true },
  "miso_unpasteurized": { score: 2, hasLiveCultures: true },
  "greek_yogurt": { score: 2, hasLiveCultures: true },
  "kombucha": { score: 1.5, hasLiveCultures: true },
  "sourdough": { score: 0.5, hasLiveCultures: false },
  "pasteurized_fermented": { score: 0, hasLiveCultures: false }
} as const

// ============================================================================
// POLYPHENOL/PHYTONUTRIENT SCORING (per serving of rich source)
// ============================================================================
export const POLYPHENOL_SCORES = {
  // Strong evidence
  "sulforaphane": { score: 2.5, confidence: "MODERATE", sources: ["broccoli sprouts", "cruciferous"] },
  "flavanols": { score: 2, confidence: "MODERATE", sources: ["dark chocolate", "tea", "apples"] },
  "anthocyanins": { score: 2, confidence: "MODERATE", sources: ["berries", "red cabbage"] },
  "egcg": { score: 1.5, confidence: "MODERATE", sources: ["green tea"] },
  // Moderate evidence
  "lycopene": { score: 1.5, confidence: "MODERATE", sources: ["tomatoes", "watermelon"] },
  "resveratrol": { score: 1, confidence: "LOW", sources: ["red grapes", "wine"] },
  "quercetin": { score: 1, confidence: "LOW", sources: ["onions", "apples"] },
  "curcumin": { score: 1, confidence: "LOW", sources: ["turmeric"] }
} as const

// ============================================================================
// PERSONAL CARE SCORING
// ============================================================================
export const PERSONAL_CARE_PENALTIES = {
  "parabens": -8,
  "phthalates": -8,
  "sulfates_sls_sles": -3,
  "synthetic_fragrance": -3,
  "formaldehyde_releasers": -5,
  "triclosan": -4,
  "oxybenzone": -3,
  "coal_tar": -5
} as const

export const PERSONAL_CARE_BONUSES = {
  "ceramides": 5,
  "vitamin_e_tocopherol": 3,
  "niacinamide": 3,
  "hyaluronic_acid": 2,
  "cruelty_free": 3,
  "ewg_verified": 5
} as const

// ============================================================================
// CONFIDENCE LEVELS
// ============================================================================
export type ConfidenceLevel = "HIGH" | "MODERATE" | "LOW"

export interface ConfidenceRating {
  level: ConfidenceLevel
  dataCompleteness: number // 0-100%
  message?: string
}

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,    // ≥80% data completeness + strong evidence
  MODERATE: 50, // 50-79% data completeness OR mixed evidence
  LOW: 0       // <50% data completeness OR controversial
} as const

// ============================================================================
// WARNING FLAGS
// ============================================================================
export const WARNING_FLAGS = {
  ARTIFICIAL_SWEETENERS: "Health effects actively debated; research evolving",
  ERYTHRITOL_XYLITOL: "Recent studies suggest cardiovascular concerns",
  PROCESSED_MEAT: "Strong evidence links to cancer risk (IARC Group 1)",
  ULTRA_PROCESSED: "Emerging research suggests effects beyond nutrients",
  MISSING_FIBER: "Score estimated; fiber data unavailable",
  INSUFFICIENT_DATA: "Limited data available; score is estimated"
} as const

// ============================================================================
// BEVERAGE SCORING (hydration context)
// ============================================================================
export const BEVERAGE_BASE_SCORES = {
  "water": 100,
  "mineral_water": 100,
  "sparkling_water": 98,
  "herbal_tea": 95,
  "green_tea": 92,
  "black_coffee": 90,
  "coconut_water": 80,
  "diet_soda": 60,
  "sports_drink": 50,
  "fruit_juice": 40,
  "soda": 20,
  "energy_drink": 35
} as const
