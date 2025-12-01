"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { X, Clock, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ScanHistoryItem {
  id: string
  productName: string
  score: number
  category: string
  scannedAt: number
}

interface ScanHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectScan?: (productName: string) => void
}

export function ScanHistoryModal({ isOpen, onClose, onSelectScan }: ScanHistoryModalProps) {
  const { data: session } = useSession()
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPaidUser, setIsPaidUser] = useState(false)

  useEffect(() => {
    if (isOpen && session) {
      fetchHistory()
    }
  }, [isOpen, session])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/history")
      const data = await response.json()
      setHistory(data.history || [])
      setIsPaidUser(data.isPaidUser)
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (scanId: string) => {
    try {
      await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId }),
      })
      setHistory(history.filter((item) => item.id !== scanId))
    } catch (error) {
      console.error("Error deleting scan:", error)
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
            <h2 className="text-2xl font-bold text-slate-900">Scan History</h2>
            <p className="text-slate-600 mt-1">
              {isPaidUser ? "Your complete scan history" : "Last 10 scans (upgrade for full history)"}
            </p>
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
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No scans yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Start scanning products to build your history
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(item.score)}`}
                    >
                      {item.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {item.productName}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(item.category)}`}
                        >
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.scannedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        onSelectScan?.(item.productName)
                        onClose()
                      }}
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Scan again"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isPaidUser && history.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <p className="text-sm text-center text-slate-600">
              Upgrade to Pro or Premium for unlimited scan history and export
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
