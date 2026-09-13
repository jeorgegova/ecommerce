import Image from "next/image"
import Link from "next/link"
import AmelatteBlanco from "@/assets/Logo-Amelatte-blanco-corto.png"

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/somos", label: "Somos" },
  { href: "/recetas", label: "Recetas" },
  { href: "/products", label: "Tienda" },
  { href: "/contacto", label: "Contacto" },
]

export default function Footer() {
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
            <h3 className="text-lg font-extrabold uppercase text-white">Somos Amelatte</h3>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-400">
              Café Amelatte es una compañía cuyo proceso nace del maravilloso
              mundo del café, ese café que latte en el corazón de cada una de las
              personas que hacen parte de la tradición y cultura de la región del
              viejo Caldas.
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

          <div className="flex items-start gap-5 lg:justify-center lg:pt-1">
            <p className="text-sm text-gray-400">Siguenos en:</p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/Amelatte-217262512562392?_rdc=1&_rdr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-gray-400 transition-all duration-200 hover:scale-110 hover:border-[#C8102E] hover:bg-[#C8102E] hover:text-white"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.397 20.997v-8.196h2.765l.411-3.196h-3.176V7.548c0-.926.258-1.556 1.585-1.556h1.702V3.114c-.294-.04-1.305-.127-2.482-.127-2.455 0-4.137 1.499-4.42 4.212v2.602H6.828v3.196h2.876v8.196a10 10 0 003.693 0z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/amelatte.colombia/"
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
            </div>
          </div>

          <div className="flex justify-end">
            <Image
              src={AmelatteBlanco}
              alt="Amelatte"
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
                Amelatte © {new Date().getFullYear()}.
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
