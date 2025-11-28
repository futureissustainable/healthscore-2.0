"use client"

import type React from "react"
import { useState } from "react"
import { ArrowUpRightIcon, SparklesIcon, StarIcon } from "@/components/icons"
import { useMobile } from "@/hooks/use-mobile"

interface ScoreData {
  finalScore: number
  trustScore: number
  category: string
  productName: string
  breakdown: {
    baseScore: number
    adjustments: Array<{ reason: string; points: number }>
  }
  healthierAddon?: {
    productName: string
    description: string
    scoreBoost: number
  } | null
  topInCategory?: {
    productName: string
    description: string
  } | null
  nutrients?: any
  overrideReason?: string | null
  isBestInClass?: boolean
}

interface ScoreDisplayProps {
  scoreData: ScoreData
  onReset: () => void
  onSearch: (term: string, image?: string, originalScore?: number) => void
}

interface SuggestionCardProps {
  title: string
  item: { productName: string; description: string } | null
  onSearch: () => void
  icon: React.ReactNode
  bgColor: string
  borderColor: string
  titleColor: string
}

function SuggestionCard({ title, item, onSearch, icon, bgColor, borderColor, titleColor }: SuggestionCardProps) {
  if (!item || !item.productName) return null

  return (
    <button
      onClick={onSearch}
      className={`w-full text-left p-3 sm:p-3 rounded-lg border ${bgColor} ${borderColor} transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 touch-manipulation`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-1">{icon}</div>
        <div className="flex-grow min-w-0">
          <h5 className={`text-xs font-bold uppercase tracking-wider ${titleColor}`}>{title}</h5>
          <p className="font-semibold text-slate-800 mt-1 truncate">{item.productName}</p>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.description}</p>
        </div>
      </div>
    </button>
  )
}

function AdjustmentRow({ adj }: { adj: { reason: string; points: number } }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
      <span className="text-sm text-slate-600 truncate pr-2">{adj.reason}</span>
      <span className={`text-sm font-bold flex-shrink-0 ${adj.points >= 0 ? "text-green-600" : "text-red-600"}`}>
        {adj.points > 0 ? `+${adj.points}` : adj.points}
      </span>
    </div>
  )
}

function Macro({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold text-slate-700 text-sm">
        {value ?? "0"}
        {unit}
      </p>
    </div>
  )
}

function NutritionInfo({ data }: { data: any }) {
  if (!data) return null

  return (
    <div className="w-full mt-4">
      <p className="text-center text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Macros per 100g</p>
      <div className="grid grid-cols-3 gap-y-3 gap-x-4 max-w-xs mx-auto">
        <Macro label="Protein" value={Math.round(data.proteinG)} unit="g" />
        <Macro label="Carbs" value={Math.round(data.carbohydratesG)} unit="g" />
        <Macro label="Fat" value={Math.round(data.totalFatG)} unit="g" />
        <Macro label="Fiber" value={Math.round(data.fiberG)} unit="g" />
        <Macro label="Sugar" value={Math.round(data.addedSugarG)} unit="g" />
        <Macro label="Calories" value={Math.round(data.calories)} unit=" kcal" />
      </div>
    </div>
  )
}

export function ScoreDisplay({ scoreData, onReset, onSearch }: ScoreDisplayProps) {
  const {
    finalScore,
    trustScore,
    category,
    productName,
    breakdown,
    healthierAddon,
    topInCategory,
    nutrients,
    overrideReason,
    isBestInClass,
  } = scoreData
  const [isExpanded, setIsExpanded] = useState(false)
  const isMobile = useMobile()

  const handleSuggestionSearch = (newTerm: string) => onSearch(newTerm, undefined, finalScore)

  // Extract characteristics and clean the product name
  const characteristicKeywords = ["homemade", "raw", "organic"]
  const characteristics: string[] = []
  let cleanedProductName = productName || ""

  characteristicKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "ig")
    const matches = cleanedProductName.match(regex)
    if (matches) {
      matches.forEach((match) => {
        const formattedMatch = match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
        if (!characteristics.includes(formattedMatch)) {
          characteristics.push(formattedMatch)
        }
      })
      cleanedProductName = cleanedProductName.replace(regex, "")
    }
  })
  cleanedProductName = cleanedProductName.trim().replace(/\s\s+/g, " ")

  let mainDish = cleanedProductName
  let extras = null
  const separators = [" with ", ", ", " and "]
  let firstSeparatorIndex = -1

  for (const sep of separators) {
    const index = mainDish.toLowerCase().indexOf(sep)
    if (index > 0 && (firstSeparatorIndex === -1 || index < firstSeparatorIndex)) {
      firstSeparatorIndex = index
    }
  }
  if (firstSeparatorIndex !== -1) {
    extras = mainDish.substring(firstSeparatorIndex).trim()
    mainDish = mainDish.substring(0, firstSeparatorIndex).trim()
  }

  const categoryStyles = {
    Excellent: {
      bg: "bg-green-100",
      text: "text-green-800",
      gradient: "from-green-500 to-emerald-600",
      stroke: "stroke-green-500",
    },
    Good: {
      bg: "bg-lime-100",
      text: "text-lime-800",
      gradient: "from-lime-500 to-green-500",
      stroke: "stroke-lime-500",
    },
    Moderate: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      gradient: "from-yellow-400 to-amber-500",
      stroke: "stroke-yellow-400",
    },
    Limit: {
      bg: "bg-orange-100",
      text: "text-orange-800",
      gradient: "from-orange-500 to-red-500",
      stroke: "stroke-orange-500",
    },
    Avoid: { bg: "bg-red-100", text: "text-red-800", gradient: "from-red-500 to-rose-700", stroke: "stroke-red-500" },
  }
  const styles = categoryStyles[category as keyof typeof categoryStyles]
  const circumference = 2 * Math.PI * 52
  const strokeDashoffset = circumference - (finalScore / 100) * circumference

  return (
    <div className="w-full max-w-sm sm:max-w-md min-h-[550px] mx-auto bg-white/60 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-lg p-4 sm:p-6 flex flex-col items-center animate-fade-in">
      <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 sm:gap-4 px-1">
        <div className="flex-1 min-w-0">
          <h2
            className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 tracking-tight line-clamp-2"
            title={productName}
          >
            {mainDish}
          </h2>
          {extras && <p className="text-sm text-slate-500 line-clamp-1 -mt-1">{extras}</p>}
          {characteristics.length > 0 && (
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mt-1">
              {characteristics.join(" • ")}
            </div>
          )}
        </div>
        {trustScore && (
          <p className="text-sm text-slate-500 whitespace-nowrap flex-shrink-0 self-start sm:self-auto">
            Trust: {trustScore}%
          </p>
        )}
      </div>

      <div className="relative my-4 sm:my-4">
        <svg className="w-32 h-32 sm:w-40 sm:h-40 transform -rotate-90 mx-auto" viewBox="0 0 120 120">
          <circle className="stroke-slate-200" cx="60" cy="60" r="52" strokeWidth="12" fill="transparent" />
          <circle
            className={styles.stroke}
            cx="60"
            cy="60"
            r="52"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${styles.gradient}`}
          >
            {finalScore}
          </span>
          <span className="text-sm text-slate-500 -mt-1">/ 100</span>
        </div>
      </div>

      {!overrideReason && <NutritionInfo data={nutrients} />}

      <div
        className={`text-center px-3 py-1 rounded-full text-sm font-bold tracking-wide ${styles.bg} ${styles.text} mt-4`}
      >
        {category}
      </div>

      {isBestInClass && !overrideReason && (
        <div className="mt-2 flex items-center justify-center gap-1.5 text-amber-500">
          <StarIcon className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">BEST IN CLASS</span>
        </div>
      )}

      {overrideReason && (
        <div className="w-full mt-4 p-3 text-center bg-red-100 border border-red-200 rounded-lg">
          <p className="text-sm font-bold text-red-800">Safety Override by AI</p>
          <p className="text-xs text-red-700 mt-1">{overrideReason}</p>
        </div>
      )}

      <div className="flex-grow w-full flex flex-col mt-4 overflow-hidden">
        {finalScore < 90 && !overrideReason && (healthierAddon || topInCategory) && (
          <div className="w-full pt-2">
            <h4 className="text-lg sm:text-xl font-medium text-slate-700 text-center mb-3 tracking-tight">
              Better Choices
            </h4>
            <div className="space-y-2 sm:space-y-3">
              {healthierAddon && (
                <SuggestionCard
                  title="Healthier Add-on"
                  item={healthierAddon}
                  onSearch={() => handleSuggestionSearch(healthierAddon.productName)}
                  icon={<ArrowUpRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />}
                  bgColor="bg-green-50/80"
                  borderColor="border-green-200/50"
                  titleColor="text-green-700"
                />
              )}
              {topInCategory && (
                <SuggestionCard
                  title="Top of Category"
                  item={topInCategory}
                  onSearch={() => handleSuggestionSearch(topInCategory.productName)}
                  icon={<SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />}
                  bgColor="bg-amber-50/80"
                  borderColor="border-amber-200/50"
                  titleColor="text-amber-600"
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-full text-xs mt-auto flex-shrink-0 pt-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-500 font-bold w-full text-center py-2 sm:py-1 touch-manipulation"
        >
          {isExpanded ? "Hide" : "Show"} Breakdown
        </button>
        {isExpanded && (
          <div className="mt-1 p-2 bg-slate-50 rounded-lg max-h-32 sm:max-h-24 overflow-y-auto">
            <AdjustmentRow adj={{ reason: "Baseline", points: breakdown.baseScore }} />
            {breakdown.adjustments.map((adj, i) => (
              <AdjustmentRow key={i} adj={adj} />
            ))}
          </div>
        )}
        <button
          onClick={onReset}
          className="w-full mt-2 text-center text-sm font-bold tracking-wide text-slate-700 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-lg py-3 sm:py-2 transition-colors flex-shrink-0 touch-manipulation"
        >
          Analyze Another
        </button>
      </div>
    </div>
  )
}
