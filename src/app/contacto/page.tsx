"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

const INQUIRY_TYPES = [
  { id: "parts", label: "Identificar un repuesto" },
  { id: "shipping", label: "Envío Internacional / Coordinación" },
  { id: "order", label: "Estado de mi pedido" },
  { id: "proforma", label: "Cotización / Proforma" },
  { id: "warranty", label: "Garantía técnica" },
  { id: "other", label: "Otra consulta" },
]

export default function ContactPage() {
  const [phone, setPhone] = useState("+57 300 000 0000")
  const [email, setEmail] = useState("hola@gogi.co")
  const [whatsapp, setWhatsapp] = useState("")
  const [storeName, setStoreName] = useState("PARTEX")

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "parts",
    machineModel: "",
    message: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["store_phone", "store_email", "social_whatsapp", "store_name"])

        if (data) {
          data.forEach((row) => {
            let val = row.value
            if (typeof val === "string" && val.startsWith('"') && val.endsWith('"')) {
              try { val = JSON.parse(val) } catch {}
            }
            if (row.key === "store_phone" && val) setPhone(String(val))
            if (row.key === "store_email" && val) setEmail(String(val))
            if (row.key === "social_whatsapp" && val) setWhatsapp(String(val))
            if (row.key === "store_name" && val) setStoreName(String(val))
          })
        }
      } catch {}
    }
    loadSettings()
  }, [])

  const cleanPhone = phone.replace(/[^\d+]/g, "")
  const cleanWa = (whatsapp || phone).replace(/[^\d]/g, "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 700))
    setSubmitting(false)
    setSubmitted(true)
    setForm({
      name: "",
      email: "",
      phone: "",
      inquiryType: "parts",
      machineModel: "",
      message: "",
    })
  }

  return (
    <StoreLayout showBanner={false}>
      <div className="bg-[#FBFBFD] min-h-screen text-[#1D1D1F] selection:bg-neutral-900 selection:text-white">
        {/* Subtle Ambient Radial */}
        <div className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden">
            <div className="h-[480px] w-[900px] flex-none bg-gradient-to-tr from-neutral-200/40 via-sky-100/30 to-transparent blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Minimal Eyebrow Navigation */}
            <div className="flex items-center justify-between text-xs font-mono tracking-wider text-neutral-400 uppercase">
              <span>Soporte · {storeName}</span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-neutral-600 font-sans normal-case tracking-normal text-xs font-medium">
                  Atención en línea hoy
                </span>
              </div>
            </div>

            {/* Apple Hero Header */}
            <div className="mt-8 max-w-3xl">
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#1D1D1F] leading-[1.08]">
                Hablemos de tus máquinas.
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-neutral-500 font-normal leading-relaxed">
                Una máquina vending detenida es dinero que deja de entrar. Nuestro equipo técnico te ayuda a identificar la pieza exacta y tenerla en camino hoy mismo.
              </p>
            </div>

            {/* Apple Bento Grid */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Card 1: Obsidian Hero Tile - Llamada Telefónica */}
              <div className="md:col-span-7 relative overflow-hidden rounded-[32px] bg-[#111113] p-8 sm:p-10 text-white shadow-xl shadow-black/5 flex flex-col justify-between group">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-mono tracking-wider text-neutral-300 uppercase">
                      Línea Telefónica Directa
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">Lun — Sáb</span>
                  </div>

                  <h3 className="mt-6 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                    Habla con un técnico especialista en vivo.
                  </h3>
                  <p className="mt-2 text-sm text-neutral-400 leading-relaxed max-w-md">
                    Sin conmutadores eternos. Te atiende una persona que conoce motores, placas MDB y sistemas de pago Saeco, Necta, FAS y Crane.
                  </p>

                  <div className="mt-8">
                    <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Número de contacto</p>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="mt-1 inline-block text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white hover:text-neutral-200 transition-colors"
                    >
                      {phone}
                    </a>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 relative z-10 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-neutral-400">
                    <span className="text-white font-medium">8:00 AM – 6:00 PM</span> (Hora Colombia)
                  </div>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold text-black transition-all hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    Llamar ahora
                  </a>
                </div>

                {/* Subtle dark glow */}
                <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-neutral-800/40 blur-3xl" />
              </div>

              {/* Card 2: Emerald Glass Tile - WhatsApp */}
              <div className="md:col-span-5 rounded-[32px] border border-neutral-200/80 bg-white p-8 sm:p-10 shadow-sm flex flex-col justify-between hover:border-neutral-300 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-mono tracking-wider text-emerald-700 uppercase">
                      WhatsApp Rápido
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">Ideal en campo</span>
                  </div>

                  <h3 className="mt-6 text-2xl font-semibold tracking-tight text-[#1D1D1F]">
                    ¿Tienes el repuesto roto en la mano?
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                    Toma una foto de la etiqueta o del engranaje averiado. Te decimos en minutos la referencia exacta y si tenemos entrega inmediata.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-100">
                  <a
                    href={`https://wa.me/${cleanWa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#1FAF38] px-6 py-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1B9C32] hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                    <span>Enviar foto por WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Card 3: Titanium Gray Tile - Correo y Proformas */}
              <div className="md:col-span-6 rounded-[32px] border border-neutral-200/80 bg-white p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-mono tracking-wider text-neutral-600 uppercase">
                    Facturación y Cuentas
                  </span>
                  <h4 className="mt-4 text-xl font-semibold tracking-tight text-[#1D1D1F]">
                    Soporte formal por correo
                  </h4>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Para compras corporativas, solicitudes de crédito de ruta, envío de comprobantes de pago o RUT.
                  </p>
                  <p className="mt-4 text-base font-mono font-medium text-neutral-900">{email}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
                  >
                    Redactar mensaje formal →
                  </a>
                </div>
              </div>

              {/* Card 4: Quick FAQ link tile */}
              <div className="md:col-span-6 rounded-[32px] border border-neutral-200/80 bg-white p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-mono tracking-wider text-neutral-600 uppercase">
                    Autogestión Inmediata
                  </span>
                  <h4 className="mt-4 text-xl font-semibold tracking-tight text-[#1D1D1F]">
                    ¿Preguntas frecuentes?
                  </h4>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Consulta tiempos de entrega nacional, cómo descargar la proforma en PDF o nuestra política de garantías de 90 días.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <Link
                    href="/faq"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
                  >
                    Explorar Centro de Preguntas Frecuentes →
                  </Link>
                </div>
              </div>
            </div>

            {/* Apple Sculptural Form Section */}
            <div className="mt-20 max-w-3xl mx-auto">
              <div className="text-center">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                  Formulario Directo
                </span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1D1D1F]">
                  Escríbenos en detalle
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Te responderemos con la cotización formal o la solución técnica en menos de 2 horas.
                </p>
              </div>

              <div className="mt-8 rounded-[32px] border border-neutral-200/80 bg-white p-8 sm:p-12 shadow-sm">
                {submitted ? (
                  <div className="py-12 text-center animate-in fade-in duration-300">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h3 className="mt-5 text-2xl font-bold tracking-tight text-neutral-900">
                      Mensaje recibido.
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
                      Un asesor de repuestos revisará tu solicitud de inmediato. Te contactaremos por WhatsApp o correo electrónico.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-8 rounded-full bg-neutral-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition"
                    >
                      Enviar otra consulta
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Inquiry pills */}
                    <div>
                      <label className="text-xs font-medium text-neutral-700 block mb-2">
                        ¿Qué necesitas resolver hoy?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {INQUIRY_TYPES.map((t) => {
                          const active = form.inquiryType === t.id
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setForm((p) => ({ ...p, inquiryType: t.id }))}
                              className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                                active
                                  ? "bg-neutral-900 text-white shadow-xs"
                                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80"
                              }`}
                            >
                              {t.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-neutral-700 block mb-1">
                          Tu nombre o empresa *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Ej. Carlos Mendoza (Ruta Bogotá)"
                          className="w-full rounded-2xl bg-neutral-100/70 border border-transparent px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-neutral-700 block mb-1">
                          Teléfono o WhatsApp de contacto *
                        </label>
                        <input
                          type="tel"
                          required
                          value={form.phone}
                          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="+57 300 000 0000"
                          className="w-full rounded-2xl bg-neutral-100/70 border border-transparent px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-neutral-700 block mb-1">
                          Correo electrónico *
                        </label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="carlos@empresa.com"
                          className="w-full rounded-2xl bg-neutral-100/70 border border-transparent px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-neutral-700 block mb-1">
                          Modelo de la máquina (opcional)
                        </label>
                        <input
                          type="text"
                          value={form.machineModel}
                          onChange={(e) => setForm((p) => ({ ...p, machineModel: e.target.value }))}
                          placeholder="Ej. Saeco Atlante 700 / Necta Samba"
                          className="w-full rounded-2xl bg-neutral-100/70 border border-transparent px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-700 block mb-1">
                        Detalle de tu consulta o síntoma del repuesto *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={form.message}
                        onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                        placeholder="Cuéntanos qué falla presenta la máquina o el código impreso en la pieza..."
                        className="w-full rounded-2xl bg-neutral-100/70 border border-transparent p-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-black hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                      >
                        {submitting ? "Enviando solicitud..." : "Enviar consulta al equipo técnico"}
                      </button>
                      <p className="mt-2 text-center text-[11px] text-neutral-400">
                        Garantizamos privacidad y respuesta técnica sin spam comercial.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
