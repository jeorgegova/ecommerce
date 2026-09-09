import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_PHONE = "50660231856"
const DEFAULT_DISPLAY = "+506 6023 1856"

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

async function getWhatsAppPhone(): Promise<{ digits: string; display: string }> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["contact_phone", "store_phone", "social_whatsapp"])
    const map = new Map<string, unknown>()
    ;(data || []).forEach((row: { key: string; value: unknown }) => map.set(row.key, row.value))
    const raw = parseSettingValue(
      map.get("contact_phone") ?? map.get("store_phone") ?? map.get("social_whatsapp"),
      DEFAULT_DISPLAY
    )
    const digits = raw.replace(/[^0-9]/g, "") || DEFAULT_PHONE
    const display = raw.trim().startsWith("+") ? raw.trim() : `+${digits}`
    return { digits, display }
  } catch {
    return { digits: DEFAULT_PHONE, display: DEFAULT_DISPLAY }
  }
}

export default async function WhatsAppFloat() {
  const { digits: phone, display } = await getWhatsAppPhone()
  const message = "Hola Willy Motos, necesito ayuda con un repuesto"
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Contactar por WhatsApp al ${display}`}
      className="group fixed bottom-[84px] right-4 z-40 flex items-center gap-3 lg:bottom-6 lg:right-6"
    >
      {/* Label pill - solo en hover, desktop */}
      <span className="hidden lg:group-hover:flex items-center rounded-full bg-white border border-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-lg shadow-gray-200/60 animate-fade-in whitespace-nowrap">
        ¿Necesitas ayuda?
        <span className="ml-2 hidden xl:inline text-gray-400 font-normal">Chatea con nosotros</span>
      </span>

      {/* Button - logo WhatsApp oficial sobre fondo blanco, mejor contraste */}
      <span className="relative flex h-[56px] w-[56px] items-center justify-center rounded-full bg-white border border-gray-100 shadow-xl shadow-gray-200/60 transition-all duration-200 group-hover:scale-105 group-hover:shadow-2xl group-hover:border-gray-200 group-active:scale-95 lg:h-14 lg:w-14">
        {/* pulse sutil detrás */}
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-10" style={{ animationDuration: "2.5s" }} />
        {/* dot online */}
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </span>
        {/* Logo WhatsApp */}
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="relative">
          <path
            fill="#25D366"
            d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.15 6.43 2.15 10.89c0 1.57.41 3.1 1.2 4.46L2 22l6.84-1.79a9.82 9.82 0 0 0 4.7 1.2h.01c5.46 0 9.9-4.43 9.9-9.89 0-2.64-1.03-5.13-2.9-7-1.87-1.86-4.35-2.9-7-2.9zm-7.01 14.6h-.01a8.03 8.03 0 0 1-4.09-1.12l-.29-.17-4.06 1.06 1.08-3.95-.19-.3a8.08 8.08 0 0 1-1.24-4.3c0-4.47 3.63-8.1 8.1-8.1 2.16 0 4.2.84 5.72 2.37a8.03 8.03 0 0 1 2.38 5.72c0 4.47-3.63 8.1-8.1 8.1zm6.7-6.06c-.37-.18-2.18-1.08-2.52-1.2-.34-.12-.59-.18-.84.18-.25.37-.96 1.2-1.18 1.45-.22.25-.44.28-.81.09-.37-.18-1.56-.57-2.97-1.83-1.1-.98-1.84-2.19-2.06-2.56-.22-.37-.02-.57.16-.76.16-.16.37-.44.55-.66.18-.22.25-.37.37-.62.12-.25.06-.46-.03-.64-.09-.18-.84-2.02-1.15-2.77-.3-.72-.61-.62-.84-.63l-.72-.01c-.25 0-.64.09-.98.46-.34.37-1.28 1.25-1.28 3.05s1.31 3.54 1.5 3.78c.18.25 2.58 3.94 6.25 5.52.87.38 1.55.6 2.08.77.87.28 1.67.24 2.3.14.7-.1 2.18-.89 2.49-1.75.31-.86.31-1.6.22-1.75-.09-.15-.34-.24-.71-.42z"
          />
        </svg>
      </span>
    </Link>
  )
}
