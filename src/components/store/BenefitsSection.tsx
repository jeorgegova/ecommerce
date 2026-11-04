"use client"

import type { StaticImageData } from "next/image"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import OrigenIcon from "@/assets/origen.png"
import CafeSupremoIcon from "@/assets/cafe_sumpremo.png"
import PresentacionIcon from "@/assets/presentacion.png"
import AromaYSaborIcon from "@/assets/aroma_y_sabor.png"
import CaracteristicasIcon from "@/assets/caracteristicas.png"
import UnGustoQueLateIcon from "@/assets/un_gusto_que_late.png"

interface Beneficio {
  titulo: string
  descripcion: string
  icono: StaticImageData
}

const leftItems: Beneficio[] = [
  {
    titulo: "ORIGEN",
    descripcion:
      "Café proveniente del municipio de Anserma - Caldas, en alianza con la cooperativa de caficultores, que garantiza los mejores estándares.",
    icono: OrigenIcon,
  },
  {
    titulo: "CAFÉ SUPREMO",
    descripcion:
      "Garantizamos que nuestro café Amelatte es 100% Arábigo seleccionados de las mallas 17 y 18.",
    icono: CafeSupremoIcon,
  },
  {
    titulo: "PRESENTACIÓN",
    descripcion:
      "Te proponemos disfrutar nuestro café molido o en grano con presentaciones de 500 gramos - 17.64 Oz",
    icono: PresentacionIcon,
  },
]

const rightItems: Beneficio[] = [
  {
    titulo: "AROMA Y SABOR",
    descripcion:
      "Nuestro Café con sabor dulce y notas a chocolate invita a un encuentro único entre el aroma, cuerpo y sabor.",
    icono: AromaYSaborIcon,
  },
  {
    titulo: "CARACTERÍSTICAS",
    descripcion:
      "Para los amantes del buen café entregamos nuestro café en una tostión media, y molienda media.",
    icono: CaracteristicasIcon,
  },
  {
    titulo: "UN GUSTO QUE LATE",
    descripcion:
      "Nuestro café Amelatte es una empresa familiar que busca para compartir en todo momento.",
    icono: UnGustoQueLateIcon,
  },
]

const mobileItems: Beneficio[] = leftItems.flatMap((item, i) => [item, rightItems[i]])

function useInView(threshold = 0.25) {
  const ref = useRef<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

function BeneficioContenedor({
  align,
  index,
  inView,
  children,
}: {
  align: "left" | "right"
  index: number
  inView: boolean
  children: React.ReactNode
}) {
  const scatter = index % 2 === 0 ? 1 : -1

  return (
    <div
      className="flex-1 transition-[transform,opacity] duration-700 ease-out"
      style={{
        transform: inView
          ? "translate(0, 0) rotate(0deg) scale(1)"
          : `translate(${scatter * (align === "left" ? 26 : -26)}px, ${scatter * 14}px) rotate(${scatter * (align === "left" ? 4 : -4)}deg) scale(0.92)`,
        opacity: inView ? 1 : 0.25,
        transitionDelay: `${inView ? index * 140 : (3 - index) * 110}ms`,
      }}
    >
      {children}
    </div>
  )
}

function BeneficioIcon({ item, align }: { item: Beneficio; align: "left" | "right" }) {
  return (
    <Image
      src={item.icono}
      alt=""
      aria-hidden="true"
      className={`h-11 w-11 lg:h-14 lg:w-14 flex-shrink-0 object-contain transition-transform duration-200 ease-out group-hover:scale-110 ${
        align === "left" ? "group-hover:translate-x-3 lg:group-hover:translate-x-6" : "group-hover:-translate-x-3 lg:group-hover:-translate-x-6"
      }`}
    />
  )
}

function BeneficioTexto({ item }: { item: Beneficio }) {
  return (
    <div>
      <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-950 transition-colors duration-300 group-hover:text-[#C8102E]">
        {item.titulo}
      </h3>
      <p className="mt-1.5 text-xs font-semibold leading-relaxed text-gray-900 sm:text-sm">{item.descripcion}</p>
    </div>
  )
}

function BeneficioItemItem({
  item,
  align,
  index,
  inView,
}: {
  item: Beneficio
  align: "left" | "right"
  index: number
  inView: boolean
}) {
  return (
    <div className="group flex items-center">
      <BeneficioContenedor align={align} index={index} inView={inView}>
        {/* Tarjeta de vidrio ultra-translúcida con blur suave para mayor visibilidad del fondo */}
        <div className="rounded-2xl border border-white/60 bg-white/20 p-4 shadow-[0_4px_20px_0_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C8102E]/35 hover:bg-white/35 hover:shadow-[0_8px_28px_rgba(200,16,46,0.1)] sm:p-5">
          {align === "left" ? (
            <div className="flex items-center justify-end gap-4 text-right sm:gap-5">
              <BeneficioTexto item={item} />
              <BeneficioIcon item={item} align="left" />
            </div>
          ) : (
            <div className="flex items-center gap-4 text-left sm:gap-5">
              <BeneficioIcon item={item} align="right" />
              <BeneficioTexto item={item} />
            </div>
          )}
        </div>
      </BeneficioContenedor>
    </div>
  )
}

/**
 * Video para Mobile: Se reproduce automáticamente en bucle continuo y sin controles.
 */
function MobileBenefitVideo({ inView }: { inView: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.defaultMuted = true

    if (inView) {
      const promise = video.play()
      if (promise !== undefined) {
        promise.catch(() => {
          // Autoplay policy handled silently
        })
      }
    }
  }, [inView])

  return (
    <div className="relative flex w-full max-w-[420px] items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/benefit_video_poster.jpg"
        className="h-auto w-full object-contain"
      >
        <source src="/benefit_video.mp4" type="video/mp4" />
      </video>
    </div>
  )
}

/**
 * Video para Desktop / Web (Estilo Apple):
 * Controlado milimétricamente por el scroll dentro de la sección fijada (pinned/sticky).
 * Mientras el usuario hace scroll, la pantalla permanece detenida en esta sección
 * hasta que el video completa su animación, momento en el cual da paso natural a la siguiente sección.
 */
function DesktopScrollVideo({
  trackRef,
}: {
  trackRef: React.RefObject<HTMLDivElement | null>
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true
    video.pause()

    let targetTime = 0
    let currentScrubTime = 0
    let rafId: number | null = null
    let isTicking = false

    const updatePlayhead = () => {
      const vid = videoRef.current
      if (!vid) {
        isTicking = false
        return
      }

      const diff = targetTime - currentScrubTime

      if (Math.abs(diff) > 0.001) {
        // Respuesta más ágil y directa al scroll (factor 0.12) manteniendo suavidad continua
        currentScrubTime += diff * 0.12
        vid.currentTime = currentScrubTime
        rafId = requestAnimationFrame(updatePlayhead)
      } else {
        currentScrubTime = targetTime
        vid.currentTime = targetTime
        isTicking = false
      }
    }

    const handleScroll = () => {
      const track = trackRef.current
      const vid = videoRef.current
      if (!track || !vid) return

      const rect = track.getBoundingClientRect()
      const windowHeight = window.innerHeight || 800

      // Distancia durante la cual el contenedor permanece fijado (sticky) en pantalla
      const pinDistance = rect.height - windowHeight
      if (pinDistance <= 0) return

      // Inicia la caída de los granos de café en cuanto la sección empieza a asomar (80% del viewport)
      const entryLead = windowHeight * 0.8
      const totalDistance = entryLead + pinDistance

      const currentDistance = entryLead - rect.top
      const progress = Math.max(0, Math.min(1, currentDistance / totalDistance))

      const duration = vid.duration || 5.45
      targetTime = progress * duration

      if (!isTicking) {
        isTicking = true
        rafId = requestAnimationFrame(updatePlayhead)
      }
    }

    // Inicialización por si la página ya carga con scroll
    handleScroll()

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [trackRef])

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      preload="auto"
      poster="/benefit_video_poster.jpg"
      onLoadedMetadata={(e) => {
        const v = e.currentTarget
        v.pause()
      }}
      className="pointer-events-none h-auto w-[920px] max-w-none object-contain transition-opacity duration-700 ease-out lg:w-[1020px] xl:w-[1120px]"
    >
      <source src="/benefit_video.mp4" type="video/mp4" />
    </video>
  )
}

export default function BenefitsSection() {
  const { ref: mobileRef, inView: mobileInView } = useInView(0.15)
  const desktopTrackRef = useRef<HTMLDivElement | null>(null)

  return (
    <>
      {/* ============================================================== */}
      {/* VERSIÓN MOBILE: Flujo estándar sin scroll lock, video automático */}
      {/* ============================================================== */}
      <section
        ref={mobileRef as React.RefObject<HTMLElement | null>}
        className="relative overflow-hidden bg-white py-16 sm:py-20 lg:hidden"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl">
              Beneficios Amelatte
            </h2>
            <div className="mx-auto mt-4 h-1.5 w-28 rounded-full bg-[#C8102E]" />
          </div>

          <div className="mt-8 flex justify-center">
            <MobileBenefitVideo inView={mobileInView} />
          </div>

          <div className="mt-10 space-y-6">
            {mobileItems.map((item, index) => (
              <BeneficioItemItem
                key={item.titulo}
                item={item}
                align="right"
                index={index}
                inView={mobileInView}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* VERSIÓN DESKTOP (ESTILO APPLE): Pinned Sticky Scroll Transition  */}
      {/* La sección se fija en pantalla mientras el usuario hace scroll,  */}
      {/* reproduciendo la animación completa antes de dar paso a la siguiente */}
      {/* ============================================================== */}
      <div
        ref={desktopTrackRef}
        className="relative hidden h-[180vh] bg-white lg:block"
      >
        {/* Contenedor Sticky que se detiene en pantalla */}
        <div className="sticky top-0 flex h-screen w-full flex-col justify-center overflow-hidden pt-12 pb-8">
          <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold uppercase tracking-tight text-gray-900 xl:text-4xl">
                Beneficios Amelatte
              </h2>
              <div className="mx-auto mt-4 h-1.5 w-28 rounded-full bg-[#C8102E]" />
            </div>

            <div className="relative mt-8 xl:mt-12">
              {/* Capa de video de fondo: centrado y controlado milimétricamente por el scroll fijado */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
                <DesktopScrollVideo trackRef={desktopTrackRef} />
              </div>

              {/* Rejilla de contenido: tarjetas con blur translúcido que flotan sobre el video */}
              <div className="relative z-10 grid min-h-[460px] grid-cols-[1fr_220px_1fr] items-center gap-6 xl:min-h-[500px] xl:grid-cols-[1fr_260px_1fr] xl:gap-8">
                <div className="order-1 space-y-6 xl:space-y-8">
                  {leftItems.map((item, i) => (
                    <BeneficioItemItem
                      key={item.titulo}
                      item={item}
                      align="left"
                      index={i}
                      inView={true}
                    />
                  ))}
                </div>

                {/* Espacio central donde resalta la bolsa de café animada */}
                <div
                  className="order-2 flex h-full min-h-[360px] items-center justify-center pointer-events-none"
                  aria-hidden="true"
                />

                <div className="order-3 space-y-6 xl:space-y-8">
                  {rightItems.map((item, i) => (
                    <BeneficioItemItem
                      key={item.titulo}
                      item={item}
                      align="right"
                      index={i}
                      inView={true}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
