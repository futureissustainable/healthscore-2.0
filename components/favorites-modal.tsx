"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { X, Heart, Trash2, ExternalLink } from "lucide-react"

interface FavoriteItem {
  id: string
  productName: string
  score: number
  category: string
  notes?: string
  addedAt: number
}

interface FavoritesModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectFavorite?: (productName: string) => void
}

export function FavoritesModal({ isOpen, onClose, onSelectFavorite }: FavoritesModalProps) {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen && session) {
      fetchFavorites()
    }
  }, [isOpen, session])

  const fetchFavorites = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/favorites")
      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (error) {
      console.error("Error fetching favorites:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (favoriteId: string) => {
    try {
      await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteId }),
      })
      setFavorites(favorites.filter((item) => item.id !== favoriteId))
    } catch (error) {
      console.error("Error removing favorite:", error)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Excellent":
        return "text-green-600 bg-green-100"
      case "Good":
        return "text-lime-600 bg-lime-100"
      case "Moderate":
        return "text-yellow-600 bg-yellow-100"
      case "Limit":
        return "text-orange-600 bg-orange-100"
      case "Avoid":
        return "text-red-600 bg-red-100"
      default:
        return "text-slate-600 bg-slate-100"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-lime-600"
    if (score >= 50) return "text-yellow-600"
    if (score >= 30) return "text-orange-600"
    return "text-red-600"
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Favorites</h2>
            <p className="text-slate-600 mt-1">Your saved healthy products</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No favorites yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Save products you love by clicking the heart icon
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xl font-bold ${getScoreColor(item.score)}`}
                        >
                          {item.score}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(item.category)}`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className="font-medium text-slate-900 mt-2 truncate">
                        {item.productName}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.notes}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        Saved {new Date(item.addedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <Heart className="w-5 h-5 text-red-500 fill-red-500 flex-shrink-0" />
                  </div>

                  <div className="absolute bottom-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        onSelectFavorite?.(item.productName)
                        onClose()
                      }}
                      className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Scan again"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
