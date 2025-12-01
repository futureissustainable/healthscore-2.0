"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { X, Save, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DietaryPreferences {
  dietType: string
  allergies: string[]
  intolerances: string[]
  healthGoals: string[]
  avoidIngredients: string[]
  preferredCuisines: string[]
  calorieTarget?: number
  proteinTarget?: number
  carbTarget?: number
  fatTarget?: number
}

const DIET_TYPES = [
  { id: "omnivore", label: "Omnivore", description: "Eats all foods" },
  { id: "vegetarian", label: "Vegetarian", description: "No meat, but dairy/eggs OK" },
  { id: "vegan", label: "Vegan", description: "No animal products" },
  { id: "pescatarian", label: "Pescatarian", description: "Fish, but no other meat" },
  { id: "keto", label: "Keto", description: "Very low carb, high fat" },
  { id: "paleo", label: "Paleo", description: "Whole foods, no processed" },
  { id: "mediterranean", label: "Mediterranean", description: "Plant-focused, healthy fats" },
]

const ALLERGIES = [
  "Peanuts",
  "Tree Nuts",
  "Milk",
  "Eggs",
  "Wheat",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
]

const HEALTH_GOALS = [
  "Weight Loss",
  "Muscle Gain",
  "Heart Health",
  "Diabetes Management",
  "Lower Cholesterol",
  "Increase Energy",
  "Better Digestion",
  "Anti-Inflammatory",
]

const CUISINES = [
  "American",
  "Italian",
  "Mexican",
  "Asian",
  "Indian",
  "Mediterranean",
  "Japanese",
  "Thai",
]

interface PreferencesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const { data: session } = useSession()
  const [preferences, setPreferences] = useState<DietaryPreferences>({
    dietType: "omnivore",
    allergies: [],
    intolerances: [],
    healthGoals: [],
    avoidIngredients: [],
    preferredCuisines: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [customIngredient, setCustomIngredient] = useState("")

  useEffect(() => {
    if (isOpen && session) {
      fetchPreferences()
    }
  }, [isOpen, session])

  const fetchPreferences = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/preferences")
      const data = await response.json()
      if (data.preferences) {
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error("Error fetching preferences:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Error saving preferences:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleArrayItem = (
    key: keyof DietaryPreferences,
    item: string
  ) => {
    const array = preferences[key] as string[]
    if (array.includes(item)) {
      setPreferences({
        ...preferences,
        [key]: array.filter((i) => i !== item),
      })
    } else {
      setPreferences({
        ...preferences,
        [key]: [...array, item],
      })
    }
  }

  const addCustomIngredient = () => {
    if (customIngredient.trim()) {
      setPreferences({
        ...preferences,
        avoidIngredients: [...preferences.avoidIngredients, customIngredient.trim()],
      })
      setCustomIngredient("")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dietary Preferences</h2>
            <p className="text-slate-600 mt-1">Personalize your health recommendations</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[65vh] p-6 space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Diet Type */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Diet Type</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {DIET_TYPES.map((diet) => (
                    <button
                      key={diet.id}
                      onClick={() =>
                        setPreferences({ ...preferences, dietType: diet.id })
                      }
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        preferences.dietType === diet.id
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="font-medium text-sm text-slate-900">
                        {diet.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {diet.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {ALLERGIES.map((allergy) => (
                    <button
                      key={allergy}
                      onClick={() => toggleArrayItem("allergies", allergy)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        preferences.allergies.includes(allergy)
                          ? "bg-red-100 text-red-700 border-2 border-red-300"
                          : "bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200"
                      }`}
                    >
                      {preferences.allergies.includes(allergy) && (
                        <Check className="w-3 h-3 inline mr-1" />
                      )}
                      {allergy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Health Goals */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Health Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_GOALS.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => toggleArrayItem("healthGoals", goal)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        preferences.healthGoals.includes(goal)
                          ? "bg-green-100 text-green-700 border-2 border-green-300"
                          : "bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200"
                      }`}
                    >
                      {preferences.healthGoals.includes(goal) && (
                        <Check className="w-3 h-3 inline mr-1" />
                      )}
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Cuisines */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Preferred Cuisines</h3>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map((cuisine) => (
                    <button
                      key={cuisine}
                      onClick={() => toggleArrayItem("preferredCuisines", cuisine)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        preferences.preferredCuisines.includes(cuisine)
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200"
                      }`}
                    >
                      {preferences.preferredCuisines.includes(cuisine) && (
                        <Check className="w-3 h-3 inline mr-1" />
                      )}
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients to Avoid */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Ingredients to Avoid</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customIngredient}
                    onChange={(e) => setCustomIngredient(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomIngredient()}
                    placeholder="Add ingredient..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Button
                    onClick={addCustomIngredient}
                    variant="outline"
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.avoidIngredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="px-3 py-1.5 rounded-full text-sm bg-orange-100 text-orange-700 border-2 border-orange-300 flex items-center gap-2"
                    >
                      {ingredient}
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            avoidIngredients: preferences.avoidIngredients.filter(
                              (i) => i !== ingredient
                            ),
                          })
                        }
                        className="hover:text-orange-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Nutrition Targets */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Daily Nutrition Targets (Optional)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-slate-600">Calories</label>
                    <input
                      type="number"
                      value={preferences.calorieTarget || ""}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          calorieTarget: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="2000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Protein (g)</label>
                    <input
                      type="number"
                      value={preferences.proteinTarget || ""}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          proteinTarget: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="50"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Carbs (g)</label>
                    <input
                      type="number"
                      value={preferences.carbTarget || ""}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          carbTarget: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="250"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Fat (g)</label>
                    <input
                      type="number"
                      value={preferences.fatTarget || ""}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          fatTarget: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="65"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
