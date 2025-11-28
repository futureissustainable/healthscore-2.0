"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { useRef, useState } from "react"

const features = [
  {
    title: "Smart Meal Planner",
    description: "AI-powered meal planning tailored to your health goals and dietary preferences",
    image: "https://cdn.prod.website-files.com/68724770b6ac4d56582886e7/68c9ab459ab037820b6ec4b8_Meal%20Planner.jpg",
    className: "col-span-2 row-span-1",
  },
  {
    title: "Discover",
    description: "Daily healthy meals and ingredient ideas curated by nutrition experts",
    image: "https://cdn.prod.website-files.com/68724770b6ac4d56582886e7/68c9ab46b83f278f07e6dd35_Discover.jpg",
    className: "col-span-1 row-span-2",
  },
  {
    title: "Preferences",
    description: "Set your diet type, allergies, and favorite ingredients for personalized recommendations",
    image: "https://cdn.prod.website-files.com/68724770b6ac4d56582886e7/68c9ab4668ec76c1d93fa31d_Diets.jpg",
    className: "col-span-1 row-span-1",
  },
  {
    title: "Community",
    description: "See community scores, daily recommendations, and connect with diet-specific communities",
    image: "https://cdn.prod.website-files.com/68724770b6ac4d56582886e7/68c9ab451c873bfb3ae14812_Community.jpg",
    className: "col-span-1 row-span-1",
  },
]

function FeatureCard({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setMousePosition({ x, y })
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setMousePosition({ x: 50, y: 50 })
  }

  return (
    <Card
      ref={cardRef}
      className={`${feature.className} relative overflow-hidden group cursor-pointer transform-gpu transition-all duration-300 ease-out hover:scale-[1.002] hover:shadow-2xl rounded-lg`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${(mousePosition.y - 50) * 0.1}deg) rotateY(${(mousePosition.x - 50) * 0.1}deg) translateZ(20px) scale(1.002)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)",
        transformStyle: "preserve-3d",
        borderRadius: "0.5rem",
      }}
    >
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <img
          src={feature.image || "/placeholder.svg"}
          alt={feature.title}
          className="w-full h-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-90 group-hover:scale-[1.01]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent transition-all duration-500 group-hover:from-slate-900/70 group-hover:via-slate-900/30" />

        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)`,
          }}
        />
      </div>

      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white border border-white/20 transition-all duration-300 group-hover:bg-white/30 group-hover:border-white/40">
          Soon
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform transition-transform duration-300 group-hover:translate-y-[-2px]">
        <h3 className="font-semibold text-lg mb-1 transition-all duration-300 group-hover:text-white/95">
          {feature.title}
        </h3>
        <p className="text-sm text-white/80 leading-relaxed line-clamp-2 transition-all duration-300 group-hover:text-white/90">
          {feature.description}
        </p>
      </div>
    </Card>
  )
}

export function FeatureShowcase() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-3">Coming Soon</h2>
        <p className="text-slate-600 text-lg">Exciting features in development to enhance your health journey</p>
      </div>

      <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[500px] sm:h-[600px]">
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} />
        ))}
      </div>
    </div>
  )
}
