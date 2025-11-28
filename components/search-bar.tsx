"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { CameraIcon } from "@/components/icons"
import { useMobile } from "@/hooks/use-mobile"

interface SearchBarProps {
  onSearch: (term: string, image?: string) => void
  isLoading: boolean
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [inputValue, setInputValue] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isLimitReached, setIsLimitReached] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    const checkUsageLimit = () => {
      const today = new Date().toDateString()
      const key = `usage_${today}`
      const used = Number.parseInt(localStorage.getItem(key) || "0")
      const limit = 30 // Updated limit from 10 to 30 to match the new daily limit
      setIsLimitReached(used >= limit)
    }

    checkUsageLimit()

    // Listen for storage changes to update limit status
    const handleStorageChange = () => {
      checkUsageLimit()
    }

    window.addEventListener("storage", handleStorageChange)
    const interval = setInterval(checkUsageLimit, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading && !isLimitReached) {
      onSearch(inputValue.trim())
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLimitReached) return

    const file = e.target.files?.[0]
    if (file) {
      setIsCapturing(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result?.toString().split(",")[1]
        if (base64String) {
          onSearch(file.name, base64String)
        }
        setIsCapturing(false)
      }
      reader.onerror = () => {
        setIsCapturing(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraClick = () => {
    if (isLimitReached) return

    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative mt-6 sm:mt-8 max-w-xl mx-auto">
      <div className="absolute -inset-2.5 rounded-2xl bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-75 blur-[9rem] animate-gradientShift"></div>
      <div
        className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 opacity-60 blur-[3rem] animate-gradientShift"
        style={{ animationDelay: "1s" }}
      ></div>

      <div
        className={`relative flex items-center w-full backdrop-blur-lg rounded-xl p-1 shadow-lg ring-1 ${
          isLimitReached ? "bg-slate-200/50 ring-slate-300/50" : "bg-slate-50/70 ring-black/5"
        }`}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading || isCapturing || isLimitReached}
          className={`flex-1 w-full h-12 sm:h-10 bg-transparent outline-none px-4 text-base sm:text-sm ${
            isLimitReached
              ? "text-slate-400 placeholder-slate-400 cursor-not-allowed"
              : "text-slate-900 placeholder-slate-500"
          }`}
          placeholder={isMobile ? "Product name or take photo" : "e.g., 'Cheerios', 'Avocado', or 'Head and Shoulders'"}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={isLimitReached}
        />
        <button
          type="button"
          aria-label={isLimitReached ? "Daily limit reached" : isCapturing ? "Processing image..." : "Take photo"}
          onClick={handleCameraClick}
          disabled={isLoading || isCapturing || isLimitReached}
          className={`ml-1 p-3 sm:p-2 rounded-lg transition-colors touch-manipulation ${
            isLimitReached
              ? "bg-slate-400 text-slate-300 cursor-not-allowed"
              : "bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-900 disabled:bg-slate-400"
          }`}
        >
          <CameraIcon className={`w-6 h-6 ${isCapturing ? "animate-pulse" : ""}`} />
        </button>
      </div>
      {isCapturing && (
        <div className="absolute top-full left-0 right-0 mt-2 text-center">
          <p className="text-sm text-slate-600 bg-white/80 backdrop-blur-sm rounded-lg py-2 px-4 inline-block">
            Processing image...
          </p>
        </div>
      )}
    </form>
  )
}
