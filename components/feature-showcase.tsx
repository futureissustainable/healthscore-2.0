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
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      ref={cardRef}
      className={`${feature.className} relative overflow-hidden group cursor-pointer transition-all duration-100 hover:shadow-brutal-white border-2 border-border hover:border-white`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={feature.image || "/placeholder.svg"}
          alt={feature.title}
          className="w-full h-full object-cover opacity-60 transition-all duration-100 group-hover:opacity-80 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>

      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium uppercase tracking-wider bg-white text-black border-2 border-white">
          Soon
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="headline font-normal text-lg mb-1">
          {feature.title}
        </h3>
        <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
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
        <h2 className="headline text-2xl sm:text-3xl font-normal text-white mb-3">Coming Soon</h2>
        <p className="text-muted-foreground text-lg">Exciting features in development to enhance your health journey</p>
      </div>

      <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[500px] sm:h-[600px]">
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} />
        ))}
      </div>
    </div>
  )
}
