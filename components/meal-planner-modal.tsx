"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { X, Calendar, ChefHat, Plus, Trash2, Sparkles, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MealPlanItem {
  id: string
  name: string
  description: string
  healthScore: number
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  prepTime?: number
  cookTime?: number
}

interface MealPlanDay {
  date: string
  meals: {
    breakfast?: MealPlanItem
    lunch?: MealPlanItem
    dinner?: MealPlanItem
    snacks?: MealPlanItem[]
  }
}

interface MealPlan {
  id: string
  name: string
  days: MealPlanDay[]
  createdAt: number
}

interface MealPlannerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MealPlannerModal({ isOpen, onClose }: MealPlannerModalProps) {
  const { data: session } = useSession()
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [daysToGenerate, setDaysToGenerate] = useState(7)
  const [additionalRequests, setAdditionalRequests] = useState("")
  const [upgradeRequired, setUpgradeRequired] = useState(false)

  useEffect(() => {
    if (isOpen && session) {
      fetchMealPlans()
    }
  }, [isOpen, session])

  const fetchMealPlans = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/meal-planner")
      const data = await response.json()

      if (data.upgradeRequired) {
        setUpgradeRequired(true)
      } else {
        setMealPlans(data.mealPlans || [])
      }
    } catch (error) {
      console.error("Error fetching meal plans:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMealPlan = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/meal-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          days: daysToGenerate,
          additionalRequests,
        }),
      })
      const data = await response.json()

      if (data.mealPlan) {
        setMealPlans([data.mealPlan, ...mealPlans])
        setSelectedPlan(data.mealPlan)
      }
    } catch (error) {
      console.error("Error generating meal plan:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteMealPlan = async (planId: string) => {
    try {
      await fetch("/api/meal-planner", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      setMealPlans(mealPlans.filter((p) => p.id !== planId))
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null)
      }
    } catch (error) {
      console.error("Error deleting meal plan:", error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100"
    if (score >= 70) return "text-lime-600 bg-lime-100"
    if (score >= 50) return "text-yellow-600 bg-yellow-100"
    if (score >= 30) return "text-orange-600 bg-orange-100"
    return "text-red-600 bg-red-100"
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Smart Meal Planner</h2>
              <p className="text-slate-600 mt-0.5">AI-powered meal planning for your health goals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[70vh]">
          {upgradeRequired ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Upgrade to Pro or Premium
                </h3>
                <p className="text-slate-600 mb-6">
                  Get access to AI-powered meal planning tailored to your dietary preferences and health goals.
                </p>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  Upgrade Now
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedPlan ? (
            <>
              {/* Plan Details */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="text-sm text-slate-500 hover:text-slate-700 mb-2"
                    >
                      ← Back to plans
                    </button>
                    <h3 className="text-xl font-bold text-slate-900">{selectedPlan.name}</h3>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedPlan.days.map((day, index) => (
                    <div key={index} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <h4 className="font-semibold text-slate-900">
                          Day {index + 1} - {day.date}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {["breakfast", "lunch", "dinner"].map((mealType) => {
                          const meal = day.meals[mealType as keyof typeof day.meals] as MealPlanItem | undefined
                          if (!meal) return null

                          return (
                            <div
                              key={mealType}
                              className="bg-white rounded-lg p-4 shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-500 uppercase">
                                  {mealType}
                                </span>
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${getScoreColor(meal.healthScore)}`}
                                >
                                  {meal.healthScore}
                                </span>
                              </div>
                              <h5 className="font-medium text-slate-900 mb-1">
                                {meal.name}
                              </h5>
                              <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                                {meal.description}
                              </p>
                              <div className="flex items-center space-x-3 text-xs text-slate-400">
                                {meal.calories && (
                                  <span>{meal.calories} kcal</span>
                                )}
                                {meal.prepTime && (
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {meal.prepTime + (meal.cookTime || 0)}m
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Plan List & Generator */}
              <div className="w-80 border-r border-slate-200 p-6 overflow-y-auto">
                <h3 className="font-semibold text-slate-900 mb-4">Your Meal Plans</h3>

                {mealPlans.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No meal plans yet. Generate your first one!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {mealPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {plan.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {plan.days.length} days •{" "}
                              {new Date(plan.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteMealPlan(plan.id)
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generator */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center">
                <div className="max-w-md w-full">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      Generate a Meal Plan
                    </h3>
                    <p className="text-slate-600">
                      Our AI will create a personalized meal plan based on your preferences
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">
                        Number of Days
                      </label>
                      <div className="flex space-x-2">
                        {[3, 5, 7, 14].map((days) => (
                          <button
                            key={days}
                            onClick={() => setDaysToGenerate(days)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                              daysToGenerate === days
                                ? "bg-green-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {days} days
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">
                        Additional Requests (optional)
                      </label>
                      <textarea
                        value={additionalRequests}
                        onChange={(e) => setAdditionalRequests(e.target.value)}
                        placeholder="e.g., High protein meals, quick recipes under 30 minutes..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={generateMealPlan}
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Meal Plan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
