"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function GarantiasPage() {
  const [phone, setPhone] = useState("+57 300 000 0000")
  const [whatsapp, setWhatsapp] = useState("")

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["store_phone", "social_whatsapp"])

        if (data) {
          data.forEach((row) => {
            let val = row.value
            if (typeof val === "string" && val.startsWith('"') && val.endsWith('"')) {
              try { val = JSON.parse(val) } catch {}
            }
            if (row.key === "store_phone" && val) setPhone(String(val))
            if (row.key === "social_whatsapp" && val) setWhatsapp(String(val))
          })
        }
      } catch {}
    }
    loadSettings()
  }, [])

  const cleanPhone = phone.replace(/[^\d+]/g, "")
  const cleanWa = (whatsapp || phone).replace(/[^\d]/g, "")

  return (
    <StoreLayout showBanner={false}>
      <div className="bg-[#FBFBFD] min-h-screen text-[#1D1D1F] selection:bg-neutral-900 selection:text-white">
        <div className="relative overflow-hidden pt-12 pb-24 sm:pt-16 sm:pb-32">
          {/* Subtle Ambient Radial */}
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden">
            <div className="h-[440px] w-[860px] flex-none bg-gradient-to-tr from-emerald-100/40 via-neutral-100 to-transparent blur-3xl" />
          </div>

          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {/* Eyebrow Navigation */}
            <div className="flex items-center justify-between text-xs font-mono tracking-wider text-neutral-400 uppercase">
              <span>Compromiso de Calidad · VendingShop</span>
              <span className="text-neutral-500 font-sans normal-case tracking-normal text-xs font-medium">
                Repuestos probados en banco
              </span>
            </div>

            {/* Apple Hero Header */}
            <div className="mt-8 max-w-3xl">
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#1D1D1F] leading-[1.08]">
                Garantía técnica. <br className="hidden sm:inline" />Cero fricción.
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-neutral-500 font-normal leading-relaxed">
                Sabemos lo crítico que es el tiempo de operación de tus máquinas expendedoras. Si una pieza presenta una falla de fábrica, la reemplazamos con prioridad absoluta.
              </p>
            </div>

            {/* Apple Numbers Bento */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-[32px] border border-neutral-200/80 bg-white p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Plazo Estándar</span>
                  <div className="mt-2 text-4xl sm:text-5xl font-mono font-bold tracking-tight text-[#1D1D1F]">
                    90 días
                  </div>
                  <h4 className="mt-3 text-base font-semibold text-neutral-900">Cobertura en componentes</h4>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Aplica a motores de espiral, fuentes de poder conmutadas y placas electrónicas madre.
                  </p>
                </div>
              </div>

              <div className="rounded-[32px] border border-neutral-200/80 bg-white p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Flexibilidad</span>
                  <div className="mt-2 text-4xl sm:text-5xl font-mono font-bold tracking-tight text-[#1D1D1F]">
                    5 días
                  </div>
                  <h4 className="mt-3 text-base font-semibold text-neutral-900">Cambio por incompatibilidad</h4>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Si te equivocaste de referencia al comprar, la cambiamos sin penalizaciones conservando el empaque original.
                  </p>
                </div>
              </div>

              <div className="rounded-[32px] border border-neutral-200/80 bg-white p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Velocidad</span>
                  <div className="mt-2 text-4xl sm:text-5xl font-mono font-bold tracking-tight text-[#1D1D1F]">
                    &lt; 24h
                  </div>
                  <h4 className="mt-3 text-base font-semibold text-neutral-900">Dictamen técnico ágil</h4>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Revisión de evidencia fotográfica y autorización de reposición inmediata para no frenar tu ruta.
                  </p>
                </div>
              </div>
            </div>

            {/* Apple Linear Step Process */}
            <div className="mt-14 rounded-[32px] border border-neutral-200/80 bg-white p-8 sm:p-12 shadow-sm">
              <div className="max-w-xl">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Protocolo Ágil</span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F]">
                  Cómo tramitar una garantía en 4 pasos
                </h3>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <span className="font-mono text-xs font-bold text-neutral-400">01</span>
                  <h5 className="text-base font-semibold text-neutral-900">Número de Pedido</h5>
                  <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Ubica tu código de orden #ORD-XXXX generado en tu compra en VendingShop.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="font-mono text-xs font-bold text-neutral-400">02</span>
                  <h5 className="text-base font-semibold text-neutral-900">Evidencia del Fallo</h5>
                  <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Toma una foto nítida de la etiqueta con número de parte y un breve video del síntoma de la máquina.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="font-mono text-xs font-bold text-neutral-400">03</span>
                  <h5 className="text-base font-semibold text-neutral-900">Envío por WhatsApp</h5>
                  <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Compártelo con nuestro equipo técnico. Analizamos la pieza en menos de 24 horas hábiles.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="font-mono text-xs font-bold text-emerald-600">04</span>
                  <h5 className="text-base font-semibold text-neutral-900">Despacho Inmediato</h5>
                  <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Te enviamos una unidad de reemplazo a tu dirección o generamos crédito a tu favor.
                  </p>
                </div>
              </div>
            </div>

            {/* Split Comparison Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-[32px] border border-neutral-200/80 bg-white p-8 sm:p-10 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">✓</span>
                  <h4 className="text-lg font-bold text-neutral-900">Casos cubiertos</h4>
                </div>
                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 mt-2 shrink-0" />
                    <span>Fallas en bobinados o engranajes internos de motores de espiral sin forzamiento mecánico.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 mt-2 shrink-0" />
                    <span>Fallo de inicialización o firmware en placas lógicas y lectores de pago MDB.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 mt-2 shrink-0" />
                    <span>Defectos de fábrica en sensores ópticos de caída de producto (drop sensors).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 mt-2 shrink-0" />
                    <span>Envío incorrecto de referencia por error en nuestro almacén logístico.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-[32px] border border-neutral-200/80 bg-white p-8 sm:p-10 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold">✕</span>
                  <h4 className="text-lg font-bold text-neutral-900">Exclusiones técnicas</h4>
                </div>
                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 mt-2 shrink-0" />
                    <span>Quemaduras por sobrevoltaje o picos de corriente causados por fallas en la red eléctrica del establecimiento.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 mt-2 shrink-0" />
                    <span>Ruptura de pines, soldaduras modificadas o cables cortados por instalación indebida.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 mt-2 shrink-0" />
                    <span>Etiquetas de número de serie o sello de garantía removidos o ilegibles.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 mt-2 shrink-0" />
                    <span>Desgaste natural de piezas de fricción tras periodos prolongados de servicio.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Apple Obsidian CTA */}
            <div className="mt-14 rounded-[32px] bg-[#111113] p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-xl shadow-black/5">
              <div className="relative z-10 max-w-xl mx-auto space-y-4">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-mono tracking-wider text-neutral-300 uppercase">
                  Canal Prioritario de Garantías
                </span>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  ¿Necesitas reportar un repuesto hoy?
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Comunícate con nuestro soporte técnico indicando tu número de orden. Resolveremos el inconveniente a la mayor brevedad.
                </p>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold text-black transition-all hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Llamar a Soporte: {phone}
                  </a>

                  {cleanWa && (
                    <a
                      href={`https://wa.me/${cleanWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#1FAF38] px-6 py-3 text-xs font-semibold text-white transition-all hover:bg-[#1B9C32] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      WhatsApp de Garantías
                    </a>
                  )}

                  <Link
                    href="/contacto"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Formulario Web →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
