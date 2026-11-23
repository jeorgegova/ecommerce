"use client"

import Image from "next/image"
import Link from "next/link"
import AmelatteBlanco from "@/assets/Logo-Amelatte-blanco-corto.png"
import { useStoreSettings } from "@/lib/hooks/useStoreSettings"

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/somos", label: "Somos" },
  { href: "/recetas", label: "Recetas" },
  { href: "/products", label: "Tienda" },
  { href: "/contacto", label: "Contacto" },
]

export default function Footer() {
  const { settings } = useStoreSettings()

  const storeName = settings.store_name || "Amelatte"
  const storeDesc =
    settings.store_description ||
    "Café Amelatte es una compañía cuyo proceso nace del maravilloso mundo del café, ese café que latte en el corazón de cada una de las personas que hacen parte de la tradición y cultura de la región del viejo Caldas."
  const facebookUrl = settings.social_facebook || "https://www.facebook.com/Amelatte-217262512562392?_rdc=1&_rdr"
  const instagramUrl = settings.social_instagram || "https://www.instagram.com/amelatte.colombia/"
  const whatsappNumber = settings.social_whatsapp || "+573184596076"
  const cleanWhatsapp = whatsappNumber.replace(/[^0-9]/g, "")
  const whatsappUrl = cleanWhatsapp ? `https://wa.me/${cleanWhatsapp}` : null

  return (
    <footer className="relative overflow-hidden bg-black px-4 pb-8 pt-16 text-gray-400 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#C8102E]/20 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-1/4 h-64 w-64 rounded-full bg-[#C8102E]/10 blur-[100px]"
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-16">
          <div>
            <h3 className="text-lg font-extrabold uppercase text-white">Somos {storeName}</h3>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-400">
              {storeDesc}
            </p>

            <nav className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[11px] font-bold uppercase tracking-widest text-gray-500 transition-colors duration-200 hover:text-[#ff2442]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-4 lg:pt-1">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-400">Síguenos en:</p>
              <div className="flex gap-3">
                {facebookUrl && (
                  <a
                    href={facebookUrl.startsWith("http") ? facebookUrl : `https://${facebookUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-gray-400 transition-all duration-200 hover:scale-110 hover:border-[#C8102E] hover:bg-[#C8102E] hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13.397 20.997v-8.196h2.765l.411-3.196h-3.176V7.548c0-.926.258-1.556 1.585-1.556h1.702V3.114c-.294-.04-1.305-.127-2.482-.127-2.455 0-4.137 1.499-4.42 4.212v2.602H6.828v3.196h2.876v8.196a10 10 0 003.693 0z" />
                    </svg>
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl.startsWith("http") ? instagramUrl : `https://instagram.com/${instagramUrl.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-gray-400 transition-all duration-200 hover:scale-110 hover:border-[#C8102E] hover:bg-[#C8102E] hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                )}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-gray-400 transition-all duration-200 hover:scale-110 hover:border-emerald-500 hover:bg-emerald-600 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.78 14.18c-.24.68-1.2 1.26-1.68 1.34-.45.08-1.04.14-3.03-.68-2.54-1.05-4.17-3.64-4.3-3.81-.13-.17-1.03-1.37-1.03-2.61 0-1.24.65-1.85.88-2.1.24-.24.51-.31.68-.31.17 0 .34 0 .49.01.16.01.37-.06.57.43.21.51.72 1.76.78 1.89.06.13.11.28.02.45-.08.17-.13.28-.26.43-.13.15-.27.34-.39.46-.13.13-.26.27-.11.53.15.26.68 1.12 1.46 1.81 1 .89 1.84 1.17 2.1 1.3.26.13.41.11.56-.06.15-.17.65-.76.82-1.02.17-.26.34-.21.57-.13.24.08 1.5.71 1.76.84.26.13.43.19.49.3.06.11.06.66-.18 1.34z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {(settings.store_phone || settings.store_email) && (
              <div className="space-y-1 text-xs text-gray-400">
                {settings.store_phone && (
                  <p className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" />
                    </svg>
                    <span>{settings.store_phone}</span>
                  </p>
                )}
                {settings.store_email && (
                  <p className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <span>{settings.store_email}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Image
              src={AmelatteBlanco}
              alt={storeName}
              className="h-36 w-auto transition-transform duration-500 ease-out hover:-rotate-3 hover:scale-105 sm:h-44 lg:h-44"
              loading="lazy"
            />
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] leading-relaxed">
              <a
                href="/politica-datos"
                className="font-bold text-white underline-offset-4 transition-colors hover:text-[#ff2442] hover:underline"
              >
                Política y Tratamiento de datos.
              </a>{" "}
              <span className="text-gray-500">
                {storeName} © {new Date().getFullYear()}.
              </span>
            </p>

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-11 items-center justify-center rounded border border-gray-200 bg-white">
                <svg viewBox="0 0 32 12" className="h-2.5 w-8">
                  <text x="1" y="10" fill="#1A1F71" fontSize="10" fontWeight="800" fontStyle="italic" fontFamily="Arial, sans-serif">VISA</text>
                </svg>
              </span>
              <span className="flex h-7 w-11 items-center justify-center rounded border border-gray-200 bg-white">
                <svg viewBox="0 0 24 14" className="h-3.5 w-6">
                  <circle cx="9.5" cy="7" r="5.5" fill="#EB001B" />
                  <circle cx="15.5" cy="7" r="5.5" fill="#F79E1B" opacity="0.95" />
                  <path d="M12.5 3a5.5 5.5 0 000 8 5.5 5.5 0 000-8z" fill="#FF5F00" />
                </svg>
              </span>
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                Pago seguro
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
