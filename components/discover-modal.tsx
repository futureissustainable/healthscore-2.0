"use client"

import { useState, useEffect } from "react"
import { X, Search, Heart, Sparkles, Leaf, Apple, Beef, Wheat, Milk, Cookie, Coffee, Star } from "lucide-react"

interface DiscoverItem {
  id: string
  name: string
  description: string
  healthScore: number
  category: string
  imageUrl: string
  nutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  tags: string[]
  featured: boolean
}

interface DiscoverModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch?: (term: string) => void
}

const CATEGORIES = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "Fruits", label: "Fruits", icon: Apple },
  { id: "Vegetables", label: "Vegetables", icon: Leaf },
  { id: "Proteins", label: "Proteins", icon: Beef },
  { id: "Grains", label: "Grains", icon: Wheat },
  { id: "Dairy", label: "Dairy", icon: Milk },
  { id: "Snacks", label: "Snacks", icon: Cookie },
  { id: "Beverages", label: "Beverages", icon: Coffee },
]

export function DiscoverModal({ isOpen, onClose, onSearch }: DiscoverModalProps) {
  const [items, setItems] = useState<DiscoverItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<DiscoverItem | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchItems()
    }
  }, [isOpen, selectedCategory])

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory)
      }

      const response = await fetch(`/api/discover?${params}`)
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("Error fetching discover items:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-600"
    if (score >= 70) return "from-lime-500 to-green-600"
    if (score >= 50) return "from-yellow-500 to-amber-600"
    if (score >= 30) return "from-orange-500 to-red-600"
    return "from-red-500 to-rose-600"
  }

  const handleScanItem = (itemName: string) => {
    onSearch?.(itemName)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Discover New Foods</h2>
              <p className="text-slate-600 mt-0.5">Explore healthy options curated for you</p>
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

        {/* Categories */}
        <div className="px-6 py-4 border-b border-slate-100 overflow-x-auto">
          <div className="flex space-x-2">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedItem ? (
            // Item Detail View
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setSelectedItem(null)}
                className="text-sm text-slate-500 hover:text-slate-700 mb-4"
              >
                ← Back to list
              </button>

              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl overflow-hidden shadow-lg">
                <div className="aspect-video relative">
                  <img
                    src={selectedItem.imageUrl || "https://source.unsplash.com/800x400/?healthy,food"}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute top-4 right-4 px-3 py-1.5 rounded-full bg-gradient-to-r ${getScoreColor(selectedItem.healthScore)} text-white font-bold`}
                  >
                    {selectedItem.healthScore}
                  </div>
                  {selectedItem.featured && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/90 text-amber-600 font-medium text-sm flex items-center">
                      <Star className="w-4 h-4 mr-1 fill-amber-500" />
                      Featured
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {selectedItem.name}
                  </h3>
                  <p className="text-slate-600 mb-4">{selectedItem.description}</p>

                  {selectedItem.nutrition && (
                    <div className="grid grid-cols-5 gap-4 mb-6">
                      {[
                        { label: "Calories", value: selectedItem.nutrition.calories, unit: "" },
                        { label: "Protein", value: selectedItem.nutrition.protein, unit: "g" },
                        { label: "Carbs", value: selectedItem.nutrition.carbs, unit: "g" },
                        { label: "Fat", value: selectedItem.nutrition.fat, unit: "g" },
                        { label: "Fiber", value: selectedItem.nutrition.fiber, unit: "g" },
                      ].map((nutrient) => (
                        <div key={nutrient.label} className="text-center">
                          <p className="text-2xl font-bold text-slate-900">
                            {nutrient.value}
                            <span className="text-sm text-slate-500">{nutrient.unit}</span>
                          </p>
                          <p className="text-xs text-slate-500">{nutrient.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleScanItem(selectedItem.name)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium transition-all"
                  >
                    Get Full Analysis
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={item.imageUrl || "https://source.unsplash.com/400x400/?healthy,food"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full bg-gradient-to-r ${getScoreColor(item.healthScore)} text-white text-xs font-bold`}
                    >
                      {item.healthScore}
                    </div>
                    {item.featured && (
                      <div className="absolute top-2 left-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">{item.category}</span>
                      {item.nutrition && (
                        <span className="text-xs text-slate-400">
                          {item.nutrition.calories} kcal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
