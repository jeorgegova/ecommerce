import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Providers from "@/components/providers"
import BackgroundPattern from "@/components/store/BackgroundPattern"
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
  title: "Wil Motos",
  description: "Tu tienda de confianza",
  icons: {
    icon: "/logoWilMotos.png",
    shortcut: "/logoWilMotos.png",
    apple: "/logoWilMotos.png",
  },
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
      <body className="flex flex-col min-h-screen bg-white text-gray-900">
        <BackgroundPattern />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
