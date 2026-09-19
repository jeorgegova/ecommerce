"use client"

import { useEffect, useRef, useState } from "react"

const testimonios = [
  {
    texto:
      "Todos mis clientes se llevan un grato recuerdo cuando después de sus comidas se deleitan con Amelatte, alguna vez te imaginaste un café que te llevará unas sensaciones maravillosas a tu cuerpo? Aquí lo tienes.",
    autor: "Alessandro Tenti",
  },
  {
    texto:
      "Un paladar exquisito se debe deleitar con este fabuloso café, Amelatte ha encontrado una calidad excepcional desarrollando una armonía en todas las propiedades del café, dulce y achocolatado, que sabor inigualable.",
    autor: "Mauricio Sanchez",
  },
  {
    texto:
      "Les puedo asegurar que si buscan sentirse lo grandes que son, acompañar sus días con café Amelatte los va a llevar a una sensación inigualable con energía, calidez y lo mejor, su delicioso sabor.",
    autor: "Antonio Nuñez",
  },
]

function useInView(threshold = 0.2) {
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

const TRAVEL_MS = 450
const HOLD_MS = 250
const STAGGER_MS = 300

export default function TestimonialsSection() {
  const { ref, inView } = useInView(0.2)
  const total = testimonios.length
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const [phases, setPhases] = useState<number[]>(() =>
    reducedMotion ? testimonios.map(() => 3) : testimonios.map(() => 0)
  )

  useEffect(() => {
    if (reducedMotion) return

    const timers: ReturnType<typeof setTimeout>[] = []

    if (inView) {
      testimonios.forEach((_, i) => {
        const t0 = i * STAGGER_MS
        timers.push(
          setTimeout(() => {
            setPhases((prev) => {
              const next = [...prev]
              next[i] = 1
              return next
            })
          }, t0)
        )
        timers.push(
          setTimeout(() => {
            setPhases((prev) => {
              const next = [...prev]
              next[i] = 2
              return next
            })
          }, t0 + TRAVEL_MS)
        )
        timers.push(
          setTimeout(() => {
            setPhases((prev) => {
              const next = [...prev]
              next[i] = 3
              return next
            })
          }, t0 + TRAVEL_MS + HOLD_MS)
        )
      })
    } else {
      testimonios.forEach((_, i) => {
        timers.push(
          setTimeout(() => {
            setPhases((prev) => {
              const next = [...prev]
              next[total - 1 - i] = 0
              return next
            })
          }, i * 120)
        )
      })
    }

    return () => timers.forEach(clearTimeout)
  }, [inView, reducedMotion, total])

  return (
    <section ref={ref as React.Ref<HTMLElement>} className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl">
            Hablan nuestros clientes
          </h2>
          <div className="mx-auto mt-4 h-1.5 w-28 rounded-full bg-[#C8102E]" />
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-gray-100">
          {testimonios.map((t, i) => {
            const phase = phases[i]
            const visible = phase >= 1
            const fakeHover = phase === 1 || phase === 2
            return (
              <div
                key={t.autor}
                className="group transition-[transform,opacity] duration-450 ease-out will-change-transform"
                data-entering={fakeHover}
                style={{
                  transform: visible ? "translateX(0)" : "translateX(260px)",
                  opacity: visible ? 1 : 0,
                  transitionDelay: visible ? "0ms" : `${(total - 1 - i) * 120}ms`,
                }}
              >
                <figure className="group relative cursor-default rounded-2xl px-4 py-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-[#F7F5F1] hover:shadow-lg hover:shadow-gray-900/5 group-data-[entering=true]:-translate-y-1 group-data-[entering=true]:bg-[#F7F5F1] group-data-[entering=true]:shadow-lg group-data-[entering=true]:shadow-gray-900/5 sm:px-6 lg:rounded-none lg:bg-transparent lg:px-10 lg:py-4 lg:hover:rounded-2xl lg:hover:bg-[#F7F5F1] lg:group-data-[entering=true]:rounded-2xl lg:group-data-[entering=true]:bg-[#F7F5F1]">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2 top-0 select-none font-serif text-6xl leading-none text-[#C8102E] opacity-0 transition-all duration-300 group-hover:opacity-100 group-data-[entering=true]:opacity-100 lg:left-4 lg:group-hover:text-[#C8102E]"
                  >
                    &ldquo;
                  </span>

                  <blockquote className="text-sm leading-relaxed text-gray-500 transition-colors duration-300 group-hover:text-gray-700 group-data-[entering=true]:text-gray-700">
                    {t.texto}
                  </blockquote>

                  <figcaption className="mt-6 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-gray-400 transition-colors duration-300 group-hover:text-[#C8102E] group-data-[entering=true]:text-[#C8102E]">
                    <span className="h-px w-4 bg-gray-300 transition-all duration-300 group-hover:w-6 group-hover:bg-[#C8102E] group-data-[entering=true]:w-6 group-data-[entering=true]:bg-[#C8102E]" />
                    {t.autor}
                  </figcaption>
                </figure>
              </div>
            )
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <span className="block h-3.5 w-3.5 rounded-full border-2 border-gray-300 transition-transform duration-300 hover:scale-125 hover:border-[#C8102E]" />
        </div>
      </div>
    </section>
  )
}
