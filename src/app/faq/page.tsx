"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

interface FaqItem {
  id: string
  category: "pedidos" | "envios" | "repuestos" | "garantias"
  question: string
  answer: string
}

const FAQ_DATA: FaqItem[] = [
  // Pedidos y Pagos
  {
    id: "p1",
    category: "pedidos",
    question: "¿Cómo funcionan las compras y pagos por transferencia bancaria?",
    answer: "Al realizar tu pedido en PARTEX, el sistema reserva tus piezas y genera de manera inmediata una proforma oficial descargable en PDF con los datos bancarios exactos (Bancolombia) y el desglose de IVA. Solo debes realizar la transferencia, enviar el comprobante a nuestro canal de WhatsApp o correo y tu orden pasará de inmediato a preparación.",
  },
  {
    id: "p2",
    category: "pedidos",
    question: "¿Dónde puedo descargar la proforma de pago en PDF de mi orden?",
    answer: "La proforma se descarga automáticamente al finalizar el checkout. Si necesitas reimprimirla o enviarla a tu departamento de contabilidad, ingresa a 'Mis Pedidos' desde el menú de tu cuenta y encontrarás el botón 'Descargar Proforma' para cada una de tus compras.",
  },
  {
    id: "p3",
    category: "pedidos",
    question: "¿Cómo y cuándo se confirma mi pago?",
    answer: "Una vez que realizas la consignación o transferencia y nos compartes el soporte junto a tu número de orden (#ORD-XXXX), nuestro equipo de tesorería valida la transacción en menos de 15 minutos en horario hábil. Inmediatamente recibirás una alerta en tu campana de notificaciones confirmando que tu pedido está listo para despacho.",
  },
  {
    id: "p4",
    category: "pedidos",
    question: "¿Emiten factura electrónica para personas jurídicas y naturales?",
    answer: "Sí. Durante el checkout o en tu perfil de usuario puedes registrar tu NIT o Cédula de Ciudadanía con el dígito de verificación y razón social. Toda compra genera documento tributario válido ante la DIAN.",
  },

  // Envíos y Logística
  {
    id: "e1",
    category: "envios",
    question: "¿Hacen envíos internacionales fuera de Colombia?",
    answer: "Sí, realizamos despachos internacionales a cualquier país de América Latina y el resto del mundo. Trabajamos con DHL Express, FedEx, UPS, casilleros internacionales o el agente de carga que elijas. Una vez creada tu orden, coordinamos directamente contigo la cotización del flete según peso, volumen y destino.",
  },
  {
    id: "e2",
    category: "envios",
    question: "¿Cómo se coordinan los envíos con el comprador?",
    answer: "Todos nuestros envíos son coordinados de manera 100% directa y personalizada con el comprador. Al confirmar tu compra o proforma, nuestro equipo de logística te contacta vía WhatsApp o llamada telefónica para acordar la transportadora de tu preferencia, verificar la dirección de entrega y convenir los detalles del despacho.",
  },
  {
    id: "e3",
    category: "envios",
    question: "¿Cuánto tiempo tarda en llegar el repuesto a mi taller u operación?",
    answer: "Para despachos en Colombia: Bogotá y municipios aledaños en 24 horas; ciudades principales (Medellín, Cali, Barranquilla, Bucaramanga) entre 24 y 48 horas hábiles. Para envíos internacionales vía express aéreo (DHL/FedEx): usualmente de 2 a 5 días hábiles dependiendo del país de destino y trámites aduaneros.",
  },
  {
    id: "e4",
    category: "envios",
    question: "¿Cómo funciona el Envío Gratis dentro de Colombia?",
    answer: "En compras nacionales que superen el monto mínimo promocional configurado en la tienda, el flete terrestre estándar corre por nuestra cuenta. Para despachos internacionales o envíos urgentes personalizados, el costo se coordina y liquida directamente con el comprador.",
  },
  {
    id: "e5",
    category: "envios",
    question: "¿Cómo recibo las actualizaciones de estado y guía de transporte?",
    answer: "A través de la campana de notificaciones de la tienda recibirás alertas en tiempo real con cada cambio de estado de tu orden (Confirmado → En preparación → Enviado → Entregado) junto con el número de guía de rastreo y la empresa transportadora acordada.",
  },

  // Repuestos y Compatibilidad
  {
    id: "r1",
    category: "repuestos",
    question: "¿Cómo sé si una pieza es compatible con mi modelo de máquina vending?",
    answer: "Cada producto incluye una ficha técnica con las marcas y series compatibles (Saeco, Necta, FAS, Bianchi, Crane, Jofemar, etc.) y código de parte original. Si tienes dudas antes de ordenar, pulsa el botón 'Hacer una pregunta' en la ficha del producto o escríbenos a WhatsApp con la foto de tu pieza averiada para darte confirmación técnica.",
  },
  {
    id: "r2",
    category: "repuestos",
    question: "¿Los componentes y motores son 100% nuevos?",
    answer: "Absolutamente. No comercializamos partes recicladas o usadas. Todos los motores de espiral, fuentes de alimentación, sistemas de refrigeración y validadores de billetes/monedas son componentes completamente nuevos de calidad industrial garantizada.",
  },
  {
    id: "r3",
    category: "repuestos",
    question: "¿Puedo encargar piezas de importación que no aparezcan en el catálogo?",
    answer: "Sí. Trabajamos directamente con fabricantes y distribuidores de repuestos vending en Europa y Norteamérica. Contáctanos por nuestro formulario o WhatsApp indicando marca, modelo de máquina y número de parte para coordinar una importación bajo pedido.",
  },

  // Garantías y Soporte
  {
    id: "g1",
    category: "garantias",
    question: "¿Cuál es la política de garantía de los repuestos?",
    answer: "Todos los componentes mecánicos y electrónicos cuentan con garantía de 30 a 90 días contra defectos de fabricación. Si un repuesto presenta una falla de fábrica comprobada, lo reemplazamos sin costo o emitimos saldo a favor para tu siguiente compra.",
  },
  {
    id: "g2",
    category: "garantias",
    question: "¿Qué ocurre si compré una referencia que no le sirvió a mi máquina?",
    answer: "Cuentas con 5 días hábiles a partir de la recepción para solicitar el cambio de la referencia, siempre y cuando la pieza no haya sido instalada, soldada ni manipulada y conserve su empaque original de fábrica.",
  },
]

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "pedidos", label: "Pedidos y Pagos" },
  { id: "envios", label: "Envíos y Guías" },
  { id: "repuestos", label: "Compatibilidad" },
  { id: "garantias", label: "Garantías" },
]

export default function FaqPage() {
  const [selectedCat, setSelectedCat] = useState("all")
  const [search, setSearch] = useState("")
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ p1: true, e1: true })
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

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCat = selectedCat === "all" || item.category === selectedCat
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      return matchesCat && matchesSearch
    })
  }, [selectedCat, search])

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return (
    <StoreLayout showBanner={false}>
      {/* Schema.org FAQPage para Google Rich Snippets y Motores IA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="bg-[#FBFBFD] min-h-screen text-[#1D1D1F] selection:bg-neutral-900 selection:text-white">
        {/* Subtle Ambient Radial */}
        <div className="relative overflow-hidden pt-12 pb-24 sm:pt-16 sm:pb-32">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden">
            <div className="h-[420px] w-[800px] flex-none bg-gradient-to-tr from-neutral-200/50 via-neutral-100 to-transparent blur-3xl" />
          </div>

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Eyebrow Navigation */}
            <div className="flex items-center justify-between text-xs font-mono tracking-wider text-neutral-400 uppercase">
              <span>Centro de Ayuda · FAQ</span>
              <Link href="/contacto" className="text-neutral-600 hover:text-black font-sans normal-case tracking-normal text-xs font-medium transition">
                ¿Prefieres hablar con un asesor? →
              </Link>
            </div>

            {/* Apple Hero Header */}
            <div className="mt-8 text-center max-w-2xl mx-auto">
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#1D1D1F] leading-[1.08]">
                Preguntas frecuentes.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-neutral-500 font-normal leading-relaxed">
                Respuestas directas sobre pedidos, transferencias bancarias, compatibilidad de piezas y tiempos de entrega.
              </p>

              {/* Minimal Search Field */}
              <div className="relative mt-8 max-w-lg mx-auto">
                <svg className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por palabra clave (ej. proforma, envío, factura)..."
                  className="w-full rounded-full bg-white border border-neutral-200/80 pl-11 pr-12 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-sm focus:border-neutral-900 focus:outline-none transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-3.5 text-xs text-neutral-400 hover:text-neutral-700"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </div>

            {/* Apple-style Filter Chips */}
            <div className="mt-10 flex gap-2 overflow-x-auto pb-2 justify-start sm:justify-center">
              {CATEGORIES.map((c) => {
                const active = selectedCat === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c.id)}
                    className={`rounded-full px-5 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                      active
                        ? "bg-[#1D1D1F] text-white shadow-xs scale-[1.02]"
                        : "bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-100 hover:text-black"
                    }`}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>

            {/* Typographic Hairline Accordion (Apple Style) */}
            <div className="mt-12 divide-y divide-neutral-200/80 border-y border-neutral-200/80">
              {filteredFaqs.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-base font-semibold text-neutral-900">No hay resultados para "{search}"</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Prueba buscando con otra palabra o consulta directamente a nuestro equipo técnico.
                  </p>
                  <button
                    onClick={() => { setSearch(""); setSelectedCat("all") }}
                    className="mt-4 rounded-full bg-neutral-900 px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
                  >
                    Restablecer búsqueda
                  </button>
                </div>
              ) : (
                filteredFaqs.map((item) => {
                  const isOpen = !!openIds[item.id]
                  return (
                    <div key={item.id} className="py-6 sm:py-7 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleAccordion(item.id)}
                        className="group flex w-full items-start justify-between gap-6 text-left"
                      >
                        <span className="text-lg sm:text-xl font-medium tracking-tight text-[#1D1D1F] group-hover:text-neutral-600 transition-colors">
                          {item.question}
                        </span>
                        <span
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${
                            isOpen ? "rotate-45 text-neutral-900" : "text-neutral-400 group-hover:text-neutral-700"
                          }`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </span>
                      </button>

                      {isOpen && (
                        <div className="mt-4 pr-10 text-sm sm:text-base text-neutral-500 leading-relaxed font-normal animate-in fade-in duration-200">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Apple "Still have questions?" Bento Banner */}
            <div className="mt-20 rounded-[32px] bg-[#111113] p-8 sm:p-12 text-white relative overflow-hidden shadow-xl shadow-black/5">
              <div className="relative z-10 max-w-xl">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-mono tracking-wider text-neutral-300 uppercase">
                  Atención Personalizada
                </span>
                <h3 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  ¿Preguntas específicas sobre tu máquina?
                </h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  Llámanos directamente o escríbenos a WhatsApp. Un técnico con experiencia real en campo te responderá de inmediato.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold text-black transition-all hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    Llamar: {phone}
                  </a>

                  {cleanWa && (
                    <a
                      href={`https://wa.me/${cleanWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#1FAF38] px-6 py-3 text-xs font-semibold text-white transition-all hover:bg-[#1B9C32] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      WhatsApp Directo
                    </a>
                  )}

                  <Link
                    href="/contacto"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Formulario →
                  </Link>
                </div>
              </div>

              {/* Ambient decoration */}
              <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-neutral-800/40 blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
