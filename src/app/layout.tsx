import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Providers from "@/components/providers"
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
  title: "GoGi",
  description: "Tu tienda de confianza",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#111827",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="flex flex-col bg-white text-gray-900 max-lg:h-dvh max-lg:overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
