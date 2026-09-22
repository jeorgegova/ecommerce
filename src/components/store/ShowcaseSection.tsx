"use client"

import type { StaticImageData } from "next/image"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import TableTopImg from "@/assets/tableTop.jpg"
import VendingImg from "@/assets/vending.jpg"
import CafeImg from "@/assets/cafeAmelatte.jpg"

interface ShowcaseItem {
  titulo: string
  descripcion: string
  href: string
  imagen: StaticImageData
}

const items: ShowcaseItem[] = [
  {
    titulo: "TABLE TOP",
    descripcion:
      "Nuestra máquina Bunn ofrece un proceso de preparación de café por goteo, una manera sencilla para darte gusto en tu lugar de trabajo y consentirte con nuestro café Amelatte.",
    href: "/table-top",
    imagen: TableTopImg,
  },
  {
    titulo: "VENDING",
    descripcion:
      "Ofrecemos máquinas expendedoras para ubicar en una empresa o cualquier otro lugar de alto tráfico de personas para el suministro de bebidas calientes a base de café, bebidas frías y snacks.",
    href: "/vending",
    imagen: VendingImg,
  },
  {
    titulo: "CAFÉ",
    descripcion:
      "Disfruta nuestro café Amelatte molido o en grano, 100% Arábigo seleccionado con presentaciones de 500 gramos.",
    href: "/cafe",
    imagen: CafeImg,
  },
]

function useInView(threshold = 0.5) {
  const ref = useRef<HTMLAnchorElement | null>(null)
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

function ShowcaseCard({ item, index }: { item: ShowcaseItem; index: number }) {
  const { ref, inView } = useInView(0.5)

  return (
    <Link
      ref={ref}
      href={item.href}
      className="group mx-auto block w-full max-w-md [perspective:1200px] sm:max-w-none"
    >
      <div
        className={`relative aspect-[552/383] w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] ${
          inView
            ? "[transform:rotateY(0deg)] group-hover:[transform:rotateY(180deg)]"
            : "[transform:rotateY(180deg)] group-hover:[transform:rotateY(360deg)]"
        }`}
        style={{ transitionDelay: `${index * 150}ms` }}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <div className="relative h-full w-full overflow-hidden rounded-3xl bg-gray-100">
            <Image
              src={item.imagen}
              alt={item.titulo}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="rounded-3xl object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-[#C8102E] p-6 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <h3 className="text-lg font-extrabold uppercase tracking-widest text-white">
            {item.titulo}
          </h3>
          <span className="mt-2 h-1 w-10 rounded-full bg-white/70" />
          <p className="mt-4 text-sm leading-relaxed text-white/90">
            {item.descripcion}
          </p>
        </div>
      </div>

      <span className="mx-auto mt-5 flex w-fit items-center justify-center rounded-lg border border-gray-200 bg-gray-100 px-10 py-2.5 text-sm uppercase tracking-widest text-gray-700 transition-colors duration-300 group-hover:border-gray-900 group-hover:bg-gray-900 group-hover:text-white">
        {item.titulo}
      </span>
    </Link>
  )
}

export default function ShowcaseSection() {
  return (
    <section className="bg-white pb-16 pt-4 sm:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {items.map((item, index) => (
            <ShowcaseCard key={item.titulo} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
