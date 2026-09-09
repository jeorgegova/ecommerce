import type { Metadata } from "next"
import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/server"
import ContactActions from "./ContactActions"

const DEFAULT_EMAIL = "wilsonalexandermontoya480@gmail.com"
const DEFAULT_PHONE = "+506 6023 1856"

function parseSettingValue(v: unknown, fallback: string): string {
  if (v === null || v === undefined) return fallback
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v)
      return typeof parsed === "string" ? parsed : v
    } catch {
      return v
    }
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  try {
    return JSON.stringify(v)
  } catch {
    return fallback
  }
}

async function getContactSettings() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["contact_email", "contact_phone", "store_email", "store_phone", "social_whatsapp"])
    const map = new Map<string, unknown>()
    ;(data || []).forEach((row: { key: string; value: unknown }) => map.set(row.key, row.value))

    const email = parseSettingValue(
      map.get("contact_email") ?? map.get("store_email"),
      DEFAULT_EMAIL
    )
    const phoneRaw = parseSettingValue(
      map.get("contact_phone") ?? map.get("store_phone") ?? map.get("social_whatsapp"),
      DEFAULT_PHONE
    )
    // normaliza teléfono para display y links
    const phoneDigits = phoneRaw.replace(/[^0-9]/g, "")
    const phoneDisplay = phoneRaw.trim().startsWith("+") ? phoneRaw.trim() : `+${phoneDigits}`
    return {
      email: email || DEFAULT_EMAIL,
      phoneRaw: phoneRaw || DEFAULT_PHONE,
      phoneDisplay: phoneDisplay || DEFAULT_PHONE,
      phoneDigits: phoneDigits || "50660231856",
    }
  } catch {
    return {
      email: DEFAULT_EMAIL,
      phoneRaw: DEFAULT_PHONE,
      phoneDisplay: DEFAULT_PHONE,
      phoneDigits: "50660231856",
    }
  }
}

export const metadata: Metadata = {
  title: "Contacto | Willy Motos",
  description: "Contacta a Willy Motos. Escríbenos o llámanos. Respuesta rápida.",
}

export default async function ContactoPage() {
  const { email, phoneDisplay, phoneDigits } = await getContactSettings()
  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <a href="/" className="hover:text-gray-600 transition-colors">Inicio</a>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-900">Contacto</span>
        </nav>

        {/* Hero */}
        <div className="mb-8 lg:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold tracking-widest text-gray-500 uppercase">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Atención directa
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-[42px] leading-none">
            Hablemos. <span className="text-gray-400 font-semibold">Estamos para ayudarte.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-500">
            ¿Duda sobre un repuesto, pedido o garantía? Escríbenos o llámanos. Respuesta rápida por correo y WhatsApp.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Email */}
          <div className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white p-6 sm:p-7 shadow-sm shadow-gray-100 hover:shadow-md hover:shadow-gray-100 transition-all">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <span className="rounded-full bg-gray-50 px-3 py-1 text-[11px] font-semibold tracking-widest text-gray-500 uppercase">Correo</span>
              </div>
              <h2 className="mt-5 text-sm font-semibold text-gray-900">Correo electrónico</h2>
              <a
                href={`mailto:${email}`}
                className="mt-1 block text-[15px] font-medium text-gray-900 hover:text-gray-700 break-all"
              >
                {email}
              </a>
              <p className="mt-1 text-xs text-gray-400">Respuesta en menos de 24 horas</p>
              <ContactActions type="email" value={email} />
            </div>
          </div>

          {/* Phone */}
          <div className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white p-6 sm:p-7 shadow-sm shadow-gray-100 hover:shadow-md hover:shadow-gray-100 transition-all">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-50 group-hover:bg-emerald-100/60 transition-colors" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.57 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.57c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold tracking-widest text-emerald-700 uppercase">Tel / WhatsApp</span>
              </div>
              <h2 className="mt-5 text-sm font-semibold text-gray-900">Teléfono</h2>
              <a href={`tel:+${phoneDigits}`} className="mt-1 block text-xl font-bold tracking-tight text-gray-900">
                {phoneDisplay}
              </a>
              <p className="mt-1 text-xs text-gray-400">Lun – Sáb, 8:00 AM – 6:00 PM (Costa Rica)</p>
              <ContactActions type="phone" value={`+${phoneDigits}`} displayValue={phoneDisplay} />
            </div>
          </div>
        </div>

        {/* Info bar */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-5 py-4 flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-100 text-gray-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Respuesta rápida</p>
              <p className="text-xs text-gray-500">WhatsApp inmediato, correo &lt;24h</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-5 py-4 flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-100 text-gray-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Soporte garantizado</p>
              <p className="text-xs text-gray-500">Cambios y garantías sin complicaciones</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-5 py-4 flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-100 text-gray-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Costa Rica</p>
              <p className="text-xs text-gray-500">Envíos a todo el país</p>
            </div>
          </div>
        </div>

        {/* CTA WhatsApp grande */}
        <div className="mt-8 rounded-[24px] bg-gray-900 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-white">
          <div>
            <h3 className="text-lg font-bold">¿Prefieres WhatsApp?</h3>
            <p className="mt-1 text-sm text-gray-400">Mensaje directo al {phoneDisplay}. Te respondemos al instante en horario laboral.</p>
          </div>
          <a
            href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent("Hola Willy Motos, necesito ayuda con un repuesto")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.15 6.43 2.15 10.89c0 1.57.41 3.1 1.2 4.46L2 22l6.84-1.79a9.82 9.82 0 0 0 4.7 1.2h.01c5.46 0 9.9-4.43 9.9-9.89 0-2.64-1.03-5.13-2.9-7-1.87-1.86-4.35-2.9-7-2.9zm-7.01 14.6h-.01a8.03 8.03 0 0 1-4.09-1.12l-.29-.17-4.06 1.06 1.08-3.95-.19-.3a8.08 8.08 0 0 1-1.24-4.3c0-4.47 3.63-8.1 8.1-8.1 2.16 0 4.2.84 5.72 2.37a8.03 8.03 0 0 1 2.38 5.72c0 4.47-3.63 8.1-8.1 8.1zm6.7-6.06c-.37-.18-2.18-1.08-2.52-1.2-.34-.12-.59-.18-.84.18-.25.37-.96 1.2-1.18 1.45-.22.25-.44.28-.81.09-.37-.18-1.56-.57-2.97-1.83-1.1-.98-1.84-2.19-2.06-2.56-.22-.37-.02-.57.16-.76.16-.16.37-.44.55-.66.18-.22.25-.37.37-.62.12-.25.06-.46-.03-.64-.09-.18-.84-2.02-1.15-2.77-.3-.72-.61-.62-.84-.63l-.72-.01c-.25 0-.64.09-.98.46-.34.37-1.28 1.25-1.28 3.05s1.31 3.54 1.5 3.78c.18.25 2.58 3.94 6.25 5.52.87.38 1.55.6 2.08.77.87.28 1.67.24 2.3.14.7-.1 2.18-.89 2.49-1.75.31-.86.31-1.6.22-1.75-.09-.15-.34-.24-.71-.42z" />
            </svg>
            Abrir WhatsApp
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Al contactarnos aceptas ser atendido por nuestro equipo de soporte. No compartimos tus datos.
        </p>
      </div>
    </StoreLayout>
  )
}
