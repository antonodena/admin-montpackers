import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { DirectionProvider } from "@/components/ui/direction"
import { TooltipProvider } from "@/components/ui/tooltip"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Admin Montpackers",
  description: "Panel de administración para Hotel Taüll",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" dir="ltr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <DirectionProvider direction="ltr">
          <TooltipProvider>{children}</TooltipProvider>
        </DirectionProvider>
      </body>
    </html>
  )
}
