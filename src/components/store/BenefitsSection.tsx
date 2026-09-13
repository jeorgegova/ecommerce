"use client"

import type { StaticImageData } from "next/image"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import Bolsabene from "@/assets/Bolsabene.png"
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
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 transition-colors duration-300 group-hover:text-[#C8102E]">
        {item.titulo}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.descripcion}</p>
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
    <div className="group flex items-center gap-5 sm:gap-6">
      <BeneficioContenedor align={align} index={index} inView={inView}>
        {align === "left" ? (
          <div className="flex items-center justify-end gap-5 text-right lg:gap-6">
            <BeneficioTexto item={item} />
            <BeneficioIcon item={item} align="left" />
          </div>
        ) : (
          <div className="flex items-center gap-5 text-left lg:gap-6">
            <BeneficioIcon item={item} align="right" />
            <BeneficioTexto item={item} />
          </div>
        )}
      </BeneficioContenedor>
    </div>
  )
}

export default function BenefitsSection() {
  const { ref, inView } = useInView(0.2)

  return (
    <section ref={ref as React.Ref<HTMLElement>} className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl">
            Beneficios Amelatte
          </h2>
          <div className="mx-auto mt-4 h-1.5 w-28 rounded-full bg-[#C8102E]" />
        </div>

        <div className="flex justify-center lg:hidden">
          <Image
            src={Bolsabene}
            alt="Bolsa de café Amelatte"
              className="w-56 drop-shadow-xl transition-transform duration-500 ease-out hover:scale-105 sm:w-64 lg:w-96"
            priority
          />
        </div>

        <div className="mt-12 space-y-10 lg:hidden">
          {mobileItems.map((item, index) => (
            <BeneficioItemItem key={item.titulo} item={item} align="right" index={index} inView={inView} />
          ))}
        </div>

        <div className="mt-12 hidden items-center gap-8 lg:mt-16 lg:grid lg:grid-cols-3">
          <div className="order-1 space-y-16">
            {leftItems.map((item, i) => (
              <BeneficioItemItem key={item.titulo} item={item} align="left" index={i} inView={inView} />
            ))}
          </div>

          <div className="order-2 flex justify-center">
            <Image
              src={Bolsabene}
              alt="Bolsa de café Amelatte"
              className={`w-80 drop-shadow-xl transition-all duration-700 ease-out ${
                inView ? "rotate-0 scale-100 opacity-100" : "rotate-[8deg] scale-90 opacity-60"
              } lg:w-96`}
              priority
            />
          </div>

          <div className="order-3 space-y-16">
            {rightItems.map((item, i) => (
              <BeneficioItemItem key={item.titulo} item={item} align="right" index={i} inView={inView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
