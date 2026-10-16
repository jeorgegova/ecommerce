"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

const footerLinks = {
  repuestos: [
    { label: "Sistemas de Pago", href: "/categories/sistemas-de-pago" },
    { label: "Mecanismos y Motores", href: "/categories/mecanismos-y-motores" },
    { label: "Componentes Electrónicos", href: "/categories/componentes-electronicos" },
    { label: "Sistemas de Refrigeración", href: "/categories/sistemas-de-refrigeracion" },
  ],
  soporte: [
    { label: "Contacto", href: "/contacto" },
    { label: "Preguntas Frecuentes", href: "/faq" },
    { label: "Garantías y Cambios", href: "/garantias" },
    { label: "Envíos Internacionales y Nacionales", href: "/envios" },
  ],
  cuenta: [
    { label: "Mi Perfil", href: "/account" },
    { label: "Historial de Pedidos", href: "/account/orders" },
    { label: "Mis Favoritos", href: "/account/favorites" },
  ],
}

function cleanValue(val: any): string {
  if (!val) return ""
  if (typeof val === "string") {
    if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      try {
        return JSON.parse(val)
      } catch {
        return val.slice(1, -1)
      }
    }
    return val
  }
  return String(val)
}

export default function Footer() {
  const [phone, setPhone] = useState("+57 300 000 0000")
  const [email, setEmail] = useState("hola@gogi.co")
  const [whatsapp, setWhatsapp] = useState("")
  const [storeName, setStoreName] = useState("PARTEX")
  const [storeSlogan, setStoreSlogan] = useState("Professional parts & components")

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["store_phone", "store_email", "social_whatsapp", "store_name", "store_slogan"])

        if (data) {
          data.forEach((row) => {
            const val = cleanValue(row.value)
            if (row.key === "store_phone" && val) setPhone(val)
            if (row.key === "store_email" && val) setEmail(val)
            if (row.key === "social_whatsapp" && val) setWhatsapp(val)
            if (row.key === "store_name" && val) setStoreName(val)
            if (row.key === "store_slogan" && val) setStoreSlogan(val)
          })
        }
      } catch {}
    }
    fetchContact()
  }, [])

  const cleanPhone = phone.replace(/[^\d+]/g, "")
  const cleanWa = (whatsapp || phone).replace(/[^\d]/g, "")

  return (
    <footer className="border-t border-gray-900 bg-gray-950 text-gray-400 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Vista Desktop (md y superior) */}
        <div className="hidden md:grid grid-cols-4 gap-10 py-10">
          {/* Info Tienda y Contacto */}
          <div className="space-y-4">
            <Link href="/" className="group inline-flex items-center hover:opacity-90 transition-opacity">
              <img
                src="/LogoBlancoSinFondo.png"
                alt={storeName || "PARTEX"}
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02] duration-300"
                onError={(e) => { e.currentTarget.src = "/logoBlanco.png" }}
              />
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              {storeSlogan}. Calidad certificada y repuestos garantizados para mantener tu operación en marcha.
            </p>

            {/* Bloque de Contacto Directo */}
            <div className="pt-2 space-y-2 border-t border-gray-900">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Atención al cliente
              </p>
              
              {/* Teléfono */}
              <a
                href={`tel:${cleanPhone}`}
                className="group flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors"
                title="Llamar a soporte"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-900 text-gray-400 group-hover:text-white transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-200">{phone}</span>
              </a>

              {/* WhatsApp */}
              {cleanWa && (
                <a
                  href={`https://wa.me/${cleanWa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Chatear por WhatsApp"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-950/80 text-emerald-400 group-hover:bg-emerald-900 transition-colors">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </div>
                  <span className="font-medium">Chatear por WhatsApp</span>
                </a>
              )}

              {/* Email */}
              <a
                href={`mailto:${email}`}
                className="group flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                title="Escribir correo"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-900 text-gray-400 group-hover:text-white transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <span className="truncate">{email}</span>
              </a>
            </div>
          </div>

          {/* Enlaces organizados por sección */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{title}</h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Vista Móvil (compacta, funcional con teléfono directo) */}
        <div className="md:hidden flex flex-col items-center text-center gap-4 py-4">
          <div className="flex items-center justify-center">
            <img
              src="/LogoBlancoSinFondo.png"
              alt={storeName || "PARTEX"}
              className="h-9 sm:h-10 w-auto object-contain"
              onError={(e) => { e.currentTarget.src = "/logoBlanco.png" }}
            />
          </div>

          <p className="text-xs text-gray-400 max-w-[290px] leading-relaxed">
            {storeSlogan}
          </p>

          {/* Botón de llamada directa en móvil */}
          <div className="flex flex-wrap items-center justify-center gap-2 my-1">
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs ring-1 ring-gray-800 hover:bg-gray-800 transition"
            >
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span>{phone}</span>
            </a>

            {cleanWa && (
              <a
                href={`https://wa.me/${cleanWa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-800/80 hover:bg-emerald-900 transition"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>WhatsApp</span>
              </a>
            )}
          </div>

          {/* Enlaces clave para móvil */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400 font-medium my-1">
            <Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link>
            <span>•</span>
            <Link href="/faq" className="hover:text-white transition-colors">Preguntas Frecuentes</Link>
            <span>•</span>
            <Link href="/garantias" className="hover:text-white transition-colors">Garantías</Link>
            <span>•</span>
            <Link href="/envios" className="hover:text-white transition-colors">Envíos</Link>
          </div>

          <p className="text-[10px] text-gray-600">
            &copy; {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
          </p>
        </div>

        {/* Borde inferior para Desktop */}
        <div className="hidden md:flex mt-10 border-t border-gray-900 pt-6 items-center justify-between">
          <p className="text-[13px] text-gray-500">
            &copy; {new Date().getFullYear()} {storeName}. Todos los derechos reservados. {storeSlogan}.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/envios" className="hover:text-gray-300 transition-colors">Envíos internacionales y nacionales coordinados</Link>
            <span>·</span>
            <Link href="/garantias" className="hover:text-gray-300 transition-colors">Garantía certificada</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
