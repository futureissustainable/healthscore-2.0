import type { ReactNode } from "react"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-green-50/50"></div>
      <div className="relative">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-200 text-green-600">
          {icon}
        </div>
        <h3 className="mb-2 text-[1.6rem] leading-[1.25em] font-medium text-slate-800 tracking-tight text-balance">
          {title}
        </h3>
        <p className="text-[0.9rem] leading-[1.6em] font-light text-slate-600 text-pretty">{description}</p>
      </div>
    </div>
  )
}
