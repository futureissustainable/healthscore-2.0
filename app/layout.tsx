import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"
import { Providers } from "@/components/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "FeelScan - AI-Powered Health Scanner",
  description:
    "Scan. Score. Decide. The AI-powered app for health-scoring everything. Instantly understand the impact of any product on your well-being.",
  keywords: ["health", "scanner", "AI", "nutrition", "wellness", "product analysis", "health score"],
  authors: [{ name: "FeelScan" }],
  creator: "FeelScan",
  publisher: "FeelScan",
  metadataBase: new URL("https://feelscan.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://feelscan.com",
    siteName: "FeelScan",
    title: "FeelScan - AI-Powered Health Scanner",
    description: "Scan. Score. Decide. The AI-powered app for health-scoring everything.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FeelScan - AI-Powered Health Scanner",
    description: "Scan. Score. Decide. The AI-powered app for health-scoring everything.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
