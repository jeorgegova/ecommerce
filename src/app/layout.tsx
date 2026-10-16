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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://partex.co"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PARTEX | Professional parts & components",
    template: "%s | PARTEX",
  },
  description: "Catálogo especializado de repuestos, bombas, motores y componentes para máquinas expendedoras y café vending. Envíos nacionales e internacionales coordinados.",
  keywords: [
    "repuestos vending",
    "repuestos para maquinas vending",
    "partes vending colombia",
    "motores vending",
    "bombas ep5 ulka",
    "validador de billetes vending",
    "saeco repuestos",
    "necta repuestos",
    "PARTEX",
    "professional parts and components",
  ],
  authors: [{ name: "PARTEX" }],
  creator: "PARTEX",
  publisher: "PARTEX",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PARTEX | Professional parts & components",
    description: "Repuestos y componentes garantizados para máquinas vending e industriales. Envíos nacionales e internacionales.",
    url: siteUrl,
    siteName: "PARTEX",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "/LogoLetraNegra.png",
        width: 1580,
        height: 504,
        alt: "PARTEX - Professional parts & components",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PARTEX | Professional parts & components",
    description: "Repuestos y componentes certificados para máquinas vending con envíos nacionales e internacionales.",
    images: ["/LogoLetraNegra.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        {/* Structured Data: Organization para Google Knowledge Graph y Motores IA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PARTEX",
              alternateName: "PARTEX - Professional parts & components",
              url: siteUrl,
              logo: `${siteUrl}/LogoLetraNegra.png`,
              description: "Especialistas en repuestos, partes mecánicas, componentes electrónicos y accesorios para máquinas expendedoras y café vending.",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage: ["Spanish", "English"],
              },
            }),
          }}
        />
        <BackgroundPattern />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
