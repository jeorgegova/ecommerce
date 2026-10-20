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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://partexlatam.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Repuestos para Máquinas Vending en Colombia | PARTEX",
    template: "%s | Repuestos Vending Colombia | PARTEX",
  },
  description: "Especialistas en repuestos para máquinas vending en Colombia. Bombas Ulka, motores de espiral, validadores de billetes, monederos, electroválvulas y partes para máquinas expendedoras y café vending. Envíos nacionales e internacionales.",
  keywords: [
    "repuestos para maquinas vending",
    "repuestos para máquinas vending",
    "repuestos vending",
    "vending colombia",
    "repuestos vending colombia",
    "repuestos maquinas expendedoras",
    "partes vending colombia",
    "repuestos maquinas de cafe vending",
    "bombas ep5 ulka colombia",
    "bomba ulka vending",
    "motores de espiral vending",
    "validador de billetes vending",
    "monederos mdb colombia",
    "repuestos saeco vending colombia",
    "repuestos necta colombia",
    "repuestos bianchi vending",
    "repuestos jofemar colombia",
    "insumos vending colombia",
    "PARTEX",
    "professional parts and components",
  ],
  authors: [{ name: "PARTEX", url: siteUrl }],
  creator: "PARTEX",
  publisher: "PARTEX",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Repuestos para Máquinas Vending en Colombia | PARTEX",
    description: "Catálogo especializado de repuestos originales y compatibles para máquinas expendedoras y café vending en Colombia. Envíos nacionales inmediatos.",
    url: siteUrl,
    siteName: "PARTEX Vending Colombia",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "/LogoLetraNegra.png",
        width: 1580,
        height: 504,
        alt: "PARTEX - Repuestos para Máquinas Vending en Colombia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Repuestos para Máquinas Vending en Colombia | PARTEX",
    description: "Repuestos, componentes y accesorios para máquinas expendedoras y café vending en Colombia.",
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
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
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
        {/* Structured Data: WebSite con Sitelinks Searchbox y Store/Organization para Google Search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "PARTEX - Repuestos para Máquinas Vending Colombia",
                alternateName: ["PARTEX", "PARTEX Vending"],
                url: siteUrl,
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${siteUrl}/products?q={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
                inLanguage: "es-CO",
              },
              {
                "@context": "https://schema.org",
                "@type": ["Store", "Organization"],
                name: "PARTEX",
                alternateName: [
                  "PARTEX - Repuestos para Máquinas Vending",
                  "PARTEX Vending Colombia",
                  "PARTEX Professional parts & components",
                ],
                url: siteUrl,
                logo: `${siteUrl}/LogoLetraNegra.png`,
                image: `${siteUrl}/LogoLetraNegra.png`,
                description:
                  "Distribuidor y comercializador de repuestos, bombas Ulka, motores de espiral, validadores, monederos y componentes electrónicos para máquinas expendedoras y café vending en Colombia.",
                priceRange: "$$",
                currenciesAccepted: "COP",
                paymentAccepted: "Transferencia Bancolombia, Consignación, Efectivo",
                areaServed: {
                  "@type": "Country",
                  name: "Colombia",
                },
                address: {
                  "@type": "PostalAddress",
                  addressCountry: "CO",
                },
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "customer service",
                  availableLanguage: ["Spanish"],
                },
              },
            ]),
          }}
        />
        <BackgroundPattern />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
