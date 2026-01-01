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
      const limit = 30
      setIsLimitReached(used >= limit)
    }

    checkUsageLimit()

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
    <form onSubmit={handleSubmit} className="relative mt-8 sm:mt-10 max-w-xl mx-auto">
      {/* Warm glow effect */}
      <div className="absolute -inset-4 bg-primary/5 blur-[60px] -z-10"></div>

      <div
        className={`relative z-10 flex items-center w-full border p-1 rounded-xl transition-all duration-150 shadow-soft ${
          isLimitReached
            ? "bg-muted/20 border-muted"
            : "bg-card border-border hover:border-primary/50 focus-within:border-primary focus-within:shadow-warm"
        }`}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading || isCapturing || isLimitReached}
          className={`flex-1 w-full h-12 sm:h-10 bg-transparent outline-none px-4 text-base sm:text-sm rounded-lg ${
            isLimitReached
              ? "text-muted cursor-not-allowed placeholder-muted"
              : "text-foreground placeholder-muted-foreground"
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
          className={`ml-1 p-3 sm:p-2 transition-all duration-150 touch-manipulation rounded-lg ${
            isLimitReached
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 disabled:bg-muted disabled:text-muted-foreground shadow-soft-sm"
          }`}
        >
          <CameraIcon className={`w-5 h-5 ${isCapturing ? "animate-pulse" : ""}`} />
        </button>
      </div>
      {isCapturing && (
        <div className="absolute top-full left-0 right-0 mt-3 text-center z-10">
          <p className="text-sm text-muted-foreground bg-card border border-border rounded-lg py-2 px-4 inline-block shadow-soft-sm">
            Processing image...
          </p>
        </div>
      )}
    </form>
  )
}
