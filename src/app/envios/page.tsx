"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function EnviosPage() {
  const [phone, setPhone] = useState("+57 300 000 0000")
  const [whatsapp, setWhatsapp] = useState("")
  const [freeShippingMin, setFreeShippingMin] = useState(150000)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["store_phone", "social_whatsapp", "shipping_free_min"])

        if (data) {
          data.forEach((row) => {
            let val = row.value
            if (typeof val === "string" && val.startsWith('"') && val.endsWith('"')) {
              try { val = JSON.parse(val) } catch { }
            }
            if (row.key === "store_phone" && val) setPhone(String(val))
            if (row.key === "social_whatsapp" && val) setWhatsapp(String(val))
            if (row.key === "shipping_free_min" && val !== undefined) setFreeShippingMin(Number(val) || 150000)
          })
        }
      } catch { }
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
            <div className="h-[440px] w-[860px] flex-none bg-gradient-to-tr from-sky-100/50 via-neutral-100 to-transparent blur-3xl" />
          </div>

          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {/* Eyebrow Navigation */}
            <div className="flex items-center justify-between text-xs font-mono tracking-wider text-neutral-400 uppercase">
              <span>Logística Global · Nacional e Internacional</span>
              <span className="text-neutral-500 font-sans normal-case tracking-normal text-xs font-medium">
                Despachos coordinados de forma directa
              </span>
            </div>

            {/* Apple Hero Header */}
            <div className="mt-8 max-w-3xl">
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#1D1D1F] leading-[1.08]">
                Envíos internacionales. <br className="hidden sm:inline" />
                <span className="text-neutral-500 font-medium">Coordinados con el comprador.</span>
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-neutral-500 font-normal leading-relaxed">
                Hacemos envíos internacionales a cualquier destino y cubrimos todo el territorio nacional. Todos nuestros despachos son coordinados de manera directa y personalizada con el comprador para elegir la transportadora o courier idóneo, acordar tarifas preferenciales y asegurar entregas sin contratiempos.
              </p>
            </div>

            {/* Apple Numbers Bento */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Tile 1: Envíos Internacionales */}
              <div className="rounded-[32px] border border-neutral-200/80 bg-white p-8 sm:p-10 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-mono tracking-wider text-blue-700 uppercase">
                    Alcance Global
                  </span>
                  <div className="mt-4 text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[#1D1D1F]">
                    Internacional
                  </div>
                  <h4 className="mt-2 text-base font-semibold text-neutral-900">Envíos fuera de Colombia</h4>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Despachamos a América Latina y el mundo vía DHL Express, FedEx o tu agente de carga / casillero preferido con factura proforma.
                  </p>
                </div>
              </div>

              {/* Tile 2: 100% Coordinado */}
              <div className="rounded-[32px] border border-neutral-200/80 bg-white p-8 sm:p-10 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-mono tracking-wider text-emerald-700 uppercase">
                    Servicio Personalizado
                  </span>
                  <div className="mt-4 text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[#1D1D1F]">
                    100% Coordinado
                  </div>
                  <h4 className="mt-2 text-base font-semibold text-neutral-900">Acordado con el comprador</h4>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Tras confirmar tu orden, te contactamos para acordar transportadora, flete o punto de recogida que prefieras.
                  </p>
                </div>
              </div>

              {/* Tile 3: Envío Gratis Nacional */}
              <div className="rounded-[32px] border border-neutral-200/80 bg-white p-8 sm:p-10 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-mono tracking-wider text-sky-800 uppercase">
                    Beneficio Nacional
                  </span>
                  <div className="mt-4 text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[#1D1D1F]">
                    ${Number(freeShippingMin).toLocaleString("es-CO")}
                  </div>
                  <h4 className="mt-2 text-base font-semibold text-neutral-900">Envío Gratis en Colombia</h4>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    En compras nacionales superiores a este monto, el flete estándar corre por nuestra cuenta.
                  </p>
                </div>
              </div>
            </div>

            {/* Step-by-Step Flow: Cómo funciona la coordinación */}
            <div className="mt-14 rounded-[32px] border border-neutral-200/80 bg-white p-8 sm:p-12 shadow-sm">
              <div className="max-w-xl">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Proceso Logístico</span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F]">
                  ¿Cómo coordinamos el envío de tu pedido?
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Para garantizar que tu repuesto llegue en los tiempos que tu negocio necesita, operamos con un protocolo de contacto directo:
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <span className="font-mono text-xs font-bold text-neutral-400">01</span>
                  <h5 className="text-base font-semibold text-neutral-900">Realizas tu orden</h5>
                  <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Seleccionas tus piezas y confirmas el pedido. El sistema genera tu proforma con las referencias reservadas.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="font-mono text-xs font-bold text-neutral-400">02</span>
                  <h5 className="text-base font-semibold text-neutral-900">Contacto Inmediato</h5>
                  <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Te escribimos o llamamos por WhatsApp para acordar la empresa de envío (nacional o internacional) y detalles del destino.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="font-mono text-xs font-bold text-neutral-400">03</span>
                  <h5 className="text-base font-semibold text-neutral-900">Embalaje Seguro</h5>
                  <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Empacamos tus componentes con protección antiestática y amortiguación apta para flete aéreo o terrestre.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="font-mono text-xs font-bold text-emerald-600">04</span>
                  <h5 className="text-base font-semibold text-neutral-900">Guía y Seguimiento</h5>
                  <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                    Te suministramos la guía de seguimiento y actualizamos el estado de tu orden en la campana de notificaciones.
                  </p>
                </div>
              </div>
            </div>

            {/* Apple Clean Spec Table */}
            <div className="mt-8 rounded-[32px] border border-neutral-200/80 bg-white p-8 sm:p-12 shadow-sm">
              <div className="max-w-xl">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Modalidades de Transporte</span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F]">
                  Cobertura y transportadoras aliadas
                </h3>
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200/80">
                <table className="min-w-full divide-y divide-neutral-200/80 text-left text-xs sm:text-sm">
                  <thead className="bg-neutral-50 text-neutral-900 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Modalidad</th>
                      <th className="px-6 py-4">Transportadoras</th>
                      <th className="px-6 py-4">Tiempo Estimado</th>
                      <th className="px-6 py-4">Condición</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-600">
                    <tr className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-blue-700">Internacional</td>
                      <td className="px-6 py-4 font-medium text-neutral-950">DHL Express, FedEx, UPS o agente de carga del cliente</td>
                      <td className="px-6 py-4">2 a 5 días hábiles</td>
                      <td className="px-6 py-4 text-neutral-500">Coordinado según país y peso</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-neutral-900">Nacional (Colombia)</td>
                      <td className="px-6 py-4 font-medium text-neutral-950">Servientrega, Envia, Coordinadora, Interrapidísimo</td>
                      <td className="px-6 py-4">24 a 48 horas hábiles</td>
                      <td className="px-6 py-4 text-emerald-700 font-medium">Gratis desde ${freeShippingMin.toLocaleString("es-CO")}</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-neutral-900">Urgente / Mismo día</td>
                      <td className="px-6 py-4 font-medium text-neutral-950">Mensajería express directa en Manizales y municipios aledaños</td>
                      <td className="px-6 py-4">Mismo día (horas)</td>
                      <td className="px-6 py-4 text-neutral-500">Coordinado con el comprador</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Packaging & Safety Architecture */}
            <div className="mt-8 rounded-[32px] border border-neutral-200/80 bg-white p-8 sm:p-12 shadow-sm space-y-6">
              <div className="max-w-xl">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Ingeniería de Empaque</span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F]">
                  Embalaje certificado para exportación y trayectos largos
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Sabemos que un componente electrónico dañado en tránsito interrumpe la operación. Todo envío nacional o internacional cumple con riguroso protocolo de protección:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div className="rounded-2xl bg-neutral-50 p-6 border border-neutral-100">
                  <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 block mb-1">01 / Electrónica</span>
                  <h5 className="text-base font-bold text-neutral-900">Bolsa Antiestática ESD</h5>
                  <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
                    Protege procesadores, displays LCD y memorias de descargas electrostáticas durante vuelos o traslados.
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-6 border border-neutral-100">
                  <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 block mb-1">02 / Motores</span>
                  <h5 className="text-base font-bold text-neutral-900">Amortiguación de Impacto</h5>
                  <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
                    Burbuja industrial de alta densidad que previene que los piñones o ejes sufran vibraciones o quiebres.
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-6 border border-neutral-100">
                  <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 block mb-1">03 / Seguridad</span>
                  <h5 className="text-base font-bold text-neutral-900">Precinto Inviolable</h5>
                  <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
                    Caja sellada que garantiza que nadie manipuló o reemplazó las piezas desde nuestro almacén.
                  </p>
                </div>
              </div>
            </div>

            {/* Apple Obsidian CTA */}
            <div className="mt-14 rounded-[32px] bg-[#111113] p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-xl shadow-black/5">
              <div className="relative z-10 max-w-xl mx-auto space-y-4">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-mono tracking-wider text-neutral-300 uppercase">
                  Coordinación Directa
                </span>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  ¿Necesitas cotizar un envío internacional o express?
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Llámanos o escríbenos directamente por WhatsApp. Nuestro equipo de logística coordinará contigo el despacho de inmediato.
                </p>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold text-black transition-all hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Llamar: {phone}
                  </a>

                  {cleanWa && (
                    <a
                      href={`https://wa.me/${cleanWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#1FAF38] px-6 py-3 text-xs font-semibold text-white transition-all hover:bg-[#1B9C32] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      WhatsApp Logística
                    </a>
                  )}

                  <Link
                    href="/contacto"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Formulario de Contacto →
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
