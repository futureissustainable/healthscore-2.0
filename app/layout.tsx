import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"
import { Providers } from "@/components/providers"
import "./globals.css"

const generalSans = Inter({
  subsets: ["latin"],
  variable: "--font-general-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ULTRASCORE - AI Product Analyzer",
  description:
    "The AI-powered app for health-scoring everything. Instantly understand the impact of any product on your well-being.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${generalSans.variable}`}>
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
