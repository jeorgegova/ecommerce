import type { Metadata, Viewport } from "next"
import Providers from "@/components/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Amelatte",
  description: "Café Amelatte - Un gusto que late",
  icons: {
    icon: "/logoamelattecuadrado.png",
    apple: "/logoamelattecuadrado.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className="antialiased">
      <body className="flex flex-col min-h-screen bg-white text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
