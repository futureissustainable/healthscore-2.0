// Smart Recommendation Engine
// Only suggests when truly useful and relevant

import { ProductAnalysisV2 } from "./scoring-engine"

// ============================================================================
// TYPES
// ============================================================================
export interface SmartRecommendation {
  type: "addon" | "alternative" | "pairing"
  productName: string
  description: string
  reason: string
  estimatedScoreBoost?: number
  relevanceScore: number // 0-100, only show if > 60
}

export interface NutritionalGap {
  nutrient: string
  currentValue: number
  optimalValue: number
  severity: "low" | "moderate" | "critical"
}

// ============================================================================
// ADD-ON RECOMMENDATIONS BY DEFICIENCY
// ============================================================================
const ADDON_RECOMMENDATIONS: Record<string, {
  addons: Array<{
    name: string
    description: string
    boost: number
    applicableTo: string[] // food categories this applies to
  }>
}> = {
  low_fiber: {
    addons: [
      { name: "Chia Seeds", description: "Add 1 tbsp for +5g fiber and omega-3", boost: 8, applicableTo: ["yogurt", "oatmeal", "smoothie", "cereal", "salad"] },
      { name: "Ground Flaxseed", description: "Add 2 tbsp for fiber and lignans", boost: 6, applicableTo: ["yogurt", "oatmeal", "smoothie", "baking"] },
      { name: "Fresh Berries", description: "Add 1/2 cup for fiber and antioxidants", boost: 7, applicableTo: ["yogurt", "oatmeal", "cereal", "pancakes"] },
      { name: "Sliced Almonds", description: "Add 1oz for fiber, protein and healthy fats", boost: 5, applicableTo: ["yogurt", "oatmeal", "salad", "cereal"] }
    ]
  },
  low_protein: {
    addons: [
      { name: "Greek Yogurt", description: "Add 1/2 cup for +10g protein", boost: 8, applicableTo: ["smoothie", "fruit", "granola"] },
      { name: "Hemp Seeds", description: "Add 2 tbsp for +6g complete protein", boost: 6, applicableTo: ["yogurt", "oatmeal", "salad", "smoothie"] },
      { name: "Nut Butter", description: "Add 2 tbsp for protein and healthy fats", boost: 5, applicableTo: ["toast", "oatmeal", "smoothie", "fruit"] },
      { name: "Cottage Cheese", description: "Add 1/2 cup for +14g protein", boost: 9, applicableTo: ["fruit", "toast", "salad"] }
    ]
  },
  low_omega3: {
    addons: [
      { name: "Walnuts", description: "Add 1oz for ALA omega-3", boost: 6, applicableTo: ["yogurt", "oatmeal", "salad", "cereal"] },
      { name: "Chia Seeds", description: "Add 1 tbsp for omega-3 and fiber", boost: 7, applicableTo: ["yogurt", "oatmeal", "smoothie"] },
      { name: "Ground Flaxseed", description: "Add 2 tbsp for ALA omega-3", boost: 6, applicableTo: ["yogurt", "oatmeal", "smoothie", "baking"] }
    ]
  },
  high_sugar: {
    addons: [
      { name: "Cinnamon", description: "Add 1 tsp to help balance blood sugar response", boost: 2, applicableTo: ["oatmeal", "yogurt", "coffee", "smoothie"] },
      { name: "Nuts or Seeds", description: "Add protein/fat to slow sugar absorption", boost: 4, applicableTo: ["fruit", "juice", "cereal", "dessert"] }
    ]
  },
  low_antioxidants: {
    addons: [
      { name: "Fresh Berries", description: "Add for anthocyanins and vitamin C", boost: 6, applicableTo: ["yogurt", "oatmeal", "cereal", "smoothie"] },
      { name: "Cacao Nibs", description: "Add 1 tbsp for flavanols", boost: 4, applicableTo: ["yogurt", "oatmeal", "smoothie"] },
      { name: "Matcha Powder", description: "Add 1 tsp for EGCG and L-theanine", boost: 5, applicableTo: ["smoothie", "yogurt", "latte"] }
    ]
  },
  needs_fermented: {
    addons: [
      { name: "Sauerkraut", description: "Add 2 tbsp for probiotics", boost: 5, applicableTo: ["sandwich", "salad", "bowl", "meat"] },
      { name: "Kimchi", description: "Add for probiotics and flavor", boost: 6, applicableTo: ["rice", "bowl", "eggs", "noodles"] },
      { name: "Miso Paste", description: "Add to dressings or soups", boost: 4, applicableTo: ["soup", "dressing", "marinade"] }
    ]
  }
}

// ============================================================================
// CATEGORY ALTERNATIVES (only for scores < 70)
// ============================================================================
const CATEGORY_ALTERNATIVES: Record<string, Array<{
  trigger: string[] // keywords in product name
  alternative: string
  description: string
  estimatedScore: number
  minScoreGap: number // only suggest if gap is at least this much
}>> = {
  beverages: [
    { trigger: ["soda", "cola", "sprite", "fanta", "pepsi"], alternative: "Sparkling Water with Lemon", description: "Zero sugar, same fizz satisfaction", estimatedScore: 95, minScoreGap: 40 },
    { trigger: ["soda", "cola"], alternative: "Kombucha", description: "Fermented, low sugar, probiotic benefits", estimatedScore: 75, minScoreGap: 30 },
    { trigger: ["energy drink", "red bull", "monster"], alternative: "Green Tea", description: "Natural caffeine with L-theanine for smooth energy", estimatedScore: 92, minScoreGap: 35 },
    { trigger: ["energy drink"], alternative: "Black Coffee", description: "Clean caffeine, zero sugar, antioxidants", estimatedScore: 90, minScoreGap: 30 },
    { trigger: ["fruit juice", "orange juice", "apple juice"], alternative: "Whole Fruit + Water", description: "Get the fiber, skip the sugar spike", estimatedScore: 88, minScoreGap: 25 },
    { trigger: ["sports drink", "gatorade", "powerade"], alternative: "Coconut Water", description: "Natural electrolytes without artificial colors", estimatedScore: 80, minScoreGap: 20 }
  ],
  snacks: [
    { trigger: ["chips", "doritos", "cheetos", "lays"], alternative: "Roasted Chickpeas", description: "Crunchy, high protein, high fiber", estimatedScore: 78, minScoreGap: 25 },
    { trigger: ["chips", "crisps"], alternative: "Mixed Nuts", description: "Healthy fats, protein, satisfying crunch", estimatedScore: 82, minScoreGap: 25 },
    { trigger: ["candy", "gummy", "skittles", "m&m"], alternative: "Dark Chocolate (70%+)", description: "Satisfies sweet tooth with antioxidants", estimatedScore: 65, minScoreGap: 30 },
    { trigger: ["candy", "sweets"], alternative: "Fresh Berries", description: "Natural sweetness with fiber and vitamins", estimatedScore: 90, minScoreGap: 35 },
    { trigger: ["cookie", "oreo", "chips ahoy"], alternative: "Apple Slices with Almond Butter", description: "Sweet, satisfying, nutritious", estimatedScore: 85, minScoreGap: 30 },
    { trigger: ["ice cream"], alternative: "Frozen Banana Soft Serve", description: "Blend frozen bananas for creamy texture", estimatedScore: 80, minScoreGap: 25 },
    { trigger: ["ice cream"], alternative: "Greek Yogurt with Berries", description: "Creamy, protein-rich, probiotic", estimatedScore: 82, minScoreGap: 25 }
  ],
  breakfast: [
    { trigger: ["cereal", "frosted", "fruit loops", "lucky charms"], alternative: "Steel Cut Oatmeal", description: "Whole grain, high fiber, low glycemic", estimatedScore: 85, minScoreGap: 30 },
    { trigger: ["cereal"], alternative: "Greek Yogurt Parfait", description: "Protein-rich with fresh fruit and nuts", estimatedScore: 83, minScoreGap: 25 },
    { trigger: ["pastry", "pop tart", "toaster strudel"], alternative: "Whole Grain Toast with Nut Butter", description: "Complex carbs, protein, healthy fats", estimatedScore: 78, minScoreGap: 30 },
    { trigger: ["pancake", "waffle"], alternative: "Oat Pancakes", description: "Made with oats and banana, no added sugar", estimatedScore: 75, minScoreGap: 20 },
    { trigger: ["bacon", "sausage"], alternative: "Eggs with Avocado", description: "High protein, healthy fats, no processed meat", estimatedScore: 80, minScoreGap: 30 }
  ],
  meals: [
    { trigger: ["instant noodle", "ramen", "cup noodle"], alternative: "Rice Noodle Soup with Vegetables", description: "Less sodium, more nutrients", estimatedScore: 70, minScoreGap: 25 },
    { trigger: ["hot dog", "corn dog"], alternative: "Grilled Chicken Wrap", description: "Lean protein, no processed meat", estimatedScore: 75, minScoreGap: 35 },
    { trigger: ["pizza", "frozen pizza"], alternative: "Homemade Flatbread with Vegetables", description: "Control ingredients, add vegetables", estimatedScore: 70, minScoreGap: 25 },
    { trigger: ["burger", "fast food"], alternative: "Black Bean Burger", description: "High fiber, no processed meat", estimatedScore: 72, minScoreGap: 25 },
    { trigger: ["fried chicken", "nugget"], alternative: "Baked Chicken Breast", description: "Same protein, no deep frying", estimatedScore: 78, minScoreGap: 30 }
  ],
  condiments: [
    { trigger: ["ketchup"], alternative: "Fresh Salsa", description: "Less sugar, more vegetables", estimatedScore: 80, minScoreGap: 20 },
    { trigger: ["mayo", "mayonnaise"], alternative: "Avocado or Hummus", description: "Healthy fats, more nutrients", estimatedScore: 78, minScoreGap: 20 },
    { trigger: ["ranch", "blue cheese", "creamy dressing"], alternative: "Olive Oil & Lemon Dressing", description: "Heart-healthy fats, no additives", estimatedScore: 85, minScoreGap: 25 }
  ]
}

// ============================================================================
// PAIRING SUGGESTIONS (complementary foods)
// ============================================================================
const PAIRING_SUGGESTIONS: Record<string, Array<{
  trigger: string[]
  pairing: string
  reason: string
  boost: number
}>> = {
  iron_absorption: [
    { trigger: ["spinach", "lentils", "beans", "tofu"], pairing: "Citrus or Bell Peppers", reason: "Vitamin C increases iron absorption by up to 6x", boost: 8 }
  ],
  fat_soluble_vitamins: [
    { trigger: ["carrot", "sweet potato", "tomato", "leafy green"], pairing: "Olive Oil or Avocado", reason: "Fat helps absorb vitamins A, D, E, K and lycopene", boost: 6 }
  ],
  turmeric_absorption: [
    { trigger: ["turmeric", "curry"], pairing: "Black Pepper", reason: "Piperine increases curcumin absorption by 2000%", boost: 10 }
  ],
  complete_protein: [
    { trigger: ["rice", "grain"], pairing: "Beans or Lentils", reason: "Creates complete amino acid profile", boost: 7 },
    { trigger: ["beans", "lentils", "legume"], pairing: "Whole Grain", reason: "Creates complete amino acid profile", boost: 7 }
  ]
}

// ============================================================================
// MAIN RECOMMENDATION FUNCTION
// ============================================================================
export function generateSmartRecommendations(
  analysis: ProductAnalysisV2,
  finalScore: number
): { addon: SmartRecommendation | null; alternative: SmartRecommendation | null; pairing: SmartRecommendation | null } {
  const result = {
    addon: null as SmartRecommendation | null,
    alternative: null as SmartRecommendation | null,
    pairing: null as SmartRecommendation | null
  }

  // Don't recommend anything for excellent products (score >= 85)
  if (finalScore >= 85) {
    return result
  }

  const productNameLower = analysis.productName.toLowerCase()
  const nutrients = analysis.nutrientsPer100g

  // -------------------------------------------------------------------------
  // 1. FIND NUTRITIONAL GAPS AND SUGGEST ADD-ONS (only for score < 80)
  // -------------------------------------------------------------------------
  if (finalScore < 80 && nutrients) {
    const gaps: string[] = []

    // Check for low fiber
    if (nutrients.fiber < 3) {
      gaps.push("low_fiber")
    }

    // Check for low protein
    if (nutrients.protein < 5) {
      gaps.push("low_protein")
    }

    // Check for low omega-3
    if (!nutrients.omega3 || nutrients.omega3 < 0.1) {
      gaps.push("low_omega3")
    }

    // Check for high sugar (suggest balancing)
    if (nutrients.addedSugar > 10) {
      gaps.push("high_sugar")
    }

    // Check if could benefit from fermented foods
    if (!analysis.isFermented && !analysis.hasLiveCultures) {
      gaps.push("needs_fermented")
    }

    // Find applicable add-on
    for (const gap of gaps) {
      const recommendations = ADDON_RECOMMENDATIONS[gap]
      if (!recommendations) continue

      for (const addon of recommendations.addons) {
        // Check if this addon applies to this type of food
        const isApplicable = addon.applicableTo.some(category =>
          productNameLower.includes(category) ||
          matchesFoodCategory(productNameLower, category)
        )

        if (isApplicable) {
          const relevance = calculateAddonRelevance(gap, nutrients, addon.boost)
          if (relevance > 60) {
            result.addon = {
              type: "addon",
              productName: addon.name,
              description: addon.description,
              reason: getGapReason(gap),
              estimatedScoreBoost: addon.boost,
              relevanceScore: relevance
            }
            break
          }
        }
      }
      if (result.addon) break
    }
  }

  // -------------------------------------------------------------------------
  // 2. SUGGEST ALTERNATIVES (only for score < 70)
  // -------------------------------------------------------------------------
  if (finalScore < 70) {
    // Determine category
    let categoryAlternatives: typeof CATEGORY_ALTERNATIVES.beverages = []

    if (analysis.productCategory === "Beverage" || analysis.beverageType) {
      categoryAlternatives = CATEGORY_ALTERNATIVES.beverages
    } else {
      // Check all food categories
      const allCategories = [...CATEGORY_ALTERNATIVES.snacks, ...CATEGORY_ALTERNATIVES.breakfast,
                           ...CATEGORY_ALTERNATIVES.meals, ...CATEGORY_ALTERNATIVES.condiments]
      categoryAlternatives = allCategories
    }

    for (const alt of categoryAlternatives) {
      const matchesTrigger = alt.trigger.some(t => productNameLower.includes(t))
      const scoreGap = alt.estimatedScore - finalScore

      if (matchesTrigger && scoreGap >= alt.minScoreGap) {
        result.alternative = {
          type: "alternative",
          productName: alt.alternative,
          description: alt.description,
          reason: `Could improve your score by ~${scoreGap} points`,
          estimatedScoreBoost: scoreGap,
          relevanceScore: Math.min(95, 60 + scoreGap)
        }
        break
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. SUGGEST PAIRINGS (for any score, based on food type)
  // -------------------------------------------------------------------------
  for (const [category, pairings] of Object.entries(PAIRING_SUGGESTIONS)) {
    for (const pairing of pairings) {
      if (pairing.trigger.some(t => productNameLower.includes(t))) {
        result.pairing = {
          type: "pairing",
          productName: pairing.pairing,
          description: pairing.reason,
          reason: "Synergistic pairing",
          estimatedScoreBoost: pairing.boost,
          relevanceScore: 75
        }
        break
      }
    }
    if (result.pairing) break
  }

  return result
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function matchesFoodCategory(productName: string, category: string): boolean {
  const categoryMappings: Record<string, string[]> = {
    yogurt: ["yogurt", "yoghurt", "greek", "skyr"],
    oatmeal: ["oatmeal", "oat", "porridge", "muesli"],
    smoothie: ["smoothie", "shake", "blend"],
    cereal: ["cereal", "granola", "flakes", "crunch"],
    salad: ["salad", "slaw", "greens"],
    toast: ["toast", "bread", "bagel"],
    fruit: ["fruit", "apple", "banana", "berry", "orange"],
    soup: ["soup", "broth", "stew"],
    bowl: ["bowl", "buddha", "grain bowl", "poke"],
    rice: ["rice", "pilaf", "risotto"],
    sandwich: ["sandwich", "sub", "wrap", "burger"],
    meat: ["chicken", "beef", "pork", "steak", "meat"],
    eggs: ["egg", "omelette", "scramble"],
    noodles: ["noodle", "pasta", "spaghetti", "ramen"]
  }

  const keywords = categoryMappings[category] || [category]
  return keywords.some(k => productName.includes(k))
}

function calculateAddonRelevance(gap: string, nutrients: any, baseBoost: number): number {
  // Higher relevance for more severe deficiencies
  let relevance = 60

  switch (gap) {
    case "low_fiber":
      if (nutrients.fiber < 1) relevance += 25
      else if (nutrients.fiber < 2) relevance += 15
      else relevance += 5
      break
    case "low_protein":
      if (nutrients.protein < 2) relevance += 25
      else if (nutrients.protein < 4) relevance += 15
      else relevance += 5
      break
    case "low_omega3":
      relevance += 15 // Always moderately relevant
      break
    case "high_sugar":
      if (nutrients.addedSugar > 20) relevance += 25
      else if (nutrients.addedSugar > 15) relevance += 15
      else relevance += 5
      break
    case "needs_fermented":
      relevance += 10 // Nice to have
      break
  }

  // Bonus for higher boost add-ons
  relevance += Math.min(10, baseBoost)

  return Math.min(95, relevance)
}

function getGapReason(gap: string): string {
  const reasons: Record<string, string> = {
    low_fiber: "Boost fiber content",
    low_protein: "Add protein",
    low_omega3: "Add omega-3 fatty acids",
    high_sugar: "Balance blood sugar impact",
    low_antioxidants: "Add antioxidants",
    needs_fermented: "Add probiotic benefits"
  }
  return reasons[gap] || "Improve nutrition"
}

// ============================================================================
// VALIDATE RECOMMENDATION (final check before showing)
// ============================================================================
export function shouldShowRecommendation(rec: SmartRecommendation | null): boolean {
  if (!rec) return false
  if (rec.relevanceScore < 60) return false
  if (!rec.productName || !rec.description) return false
  return true
}
