"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import CoffeeLoader from "@/components/store/CoffeeLoader"
import { useEffect, useState, useCallback, useRef } from "react"

interface Banner {
  id: string
  title: string | null
  subtitle: string | null
  image_url: string
  mobile_image_url: string | null
  link_url: string | null
  link_text: string | null
  sort_order: number
  layout?: string | null
}

const TEXT_VARIANTS = ["rise", "right", "left", "zoom"] as const

const VARIANT_HIDDEN: Record<(typeof TEXT_VARIANTS)[number], string> = {
  rise: "translate-y-12 opacity-0",
  right: "translate-x-20 opacity-0",
  left: "-translate-x-20 opacity-0",
  zoom: "scale-90 opacity-0",
}

const VARIANT_SHOWN: Record<(typeof TEXT_VARIANTS)[number], string> = {
  rise: "translate-y-0 opacity-100",
  right: "translate-x-0 opacity-100",
  left: "translate-x-0 opacity-100",
  zoom: "scale-100 opacity-100",
}

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)
  const [hideLoader, setHideLoader] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const firstImageRef = useRef<HTMLImageElement | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from("active_banners")
        .select("*")
        .order("sort_order", { ascending: true })
      if (data) setBanners(data)
    }
    fetchBanners()
  }, [supabase])

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length)
  }, [banners.length])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length)
  }, [banners.length])

  useEffect(() => {
    if (banners.length <= 1 || paused) return
    const interval = setInterval(next, 6000)
    return () => clearInterval(interval)
  }, [banners.length, next, paused])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > 50) prev()
    else if (delta < -50) next()
    touchStartX.current = null
  }

  const handleImageReady = useCallback(() => {
    setImagesReady(true)
  }, [])

  useEffect(() => {
    if (banners.length === 0) return
    if (firstImageRef.current?.complete) {
      requestAnimationFrame(() => requestAnimationFrame(() => setImagesReady(true)))
    }
  }, [banners])

  useEffect(() => {
    if (!imagesReady) return
    const t = setTimeout(() => setHideLoader(true), 2100)
    return () => clearTimeout(t)
  }, [imagesReady])

  const markReady = useCallback((el: HTMLImageElement | null) => {
    firstImageRef.current = el
    if (el?.complete) {
      requestAnimationFrame(() => requestAnimationFrame(() => setImagesReady(true)))
    }
  }, [])

  if (banners.length === 0) {
    return (
      <section className="relative flex h-[60vh] w-full items-center justify-center bg-white">
        <CoffeeLoader />
      </section>
    )
  }
  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`transition-opacity duration-700 ease-out ${
              i === current ? "relative z-10 opacity-100" : "absolute inset-0 z-0 opacity-0"
            }`}
            aria-hidden={i !== current}
          >
            <img
              src={banner.image_url}
              alt={banner.title || "Banner promocional"}
              className={`hidden w-full transition-[opacity,transform,filter] duration-[1200ms] delay-200 ease-out sm:block ${
                imagesReady ? "scale-100 opacity-100 blur-0" : "scale-[1.08] opacity-0 blur-lg"
              }`}
              onLoad={handleImageReady}
              ref={i === 0 ? markReady : undefined}
              fetchPriority={i === 0 ? "high" : undefined}
            />
            <img
              src={banner.mobile_image_url || banner.image_url}
              alt={banner.title || "Banner promocional"}
              className={`block w-full transition-[opacity,transform,filter] duration-[1200ms] delay-200 ease-out sm:hidden ${
                imagesReady ? "scale-100 opacity-100 blur-0" : "scale-[1.08] opacity-0 blur-lg"
              }`}
              onLoad={handleImageReady}
              fetchPriority={i === 0 ? "high" : undefined}
            />

            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-16">
              {(() => {
                const right = (banner.layout || "center") === "right"
                const active = i === current && imagesReady
                const variant = TEXT_VARIANTS[i % TEXT_VARIANTS.length]
                const anim = () =>
                  `transition-all duration-700 ease-out ${active ? VARIANT_SHOWN[variant] : VARIANT_HIDDEN[variant]}`
                const animDelay = (delay: number) => ({ transitionDelay: active ? `${delay}ms` : "0ms" })
                return (
                  <div className={`flex w-full flex-col ${right ? "items-end text-right" : "items-center text-center"}`}>
                    {banner.title && (
                      <h2
                        className={`font-extrabold leading-none tracking-tight text-[#C8102E] ${anim()} ${
                          right ? "max-w-3xl text-4xl sm:text-6xl" : "max-w-5xl text-5xl sm:text-7xl lg:text-8xl"
                        }`}
                        style={animDelay(150)}
                      >
                        {banner.title}
                      </h2>
                    )}
                    {banner.subtitle && (
                      <p
                        className={`font-bold text-white drop-shadow-md ${anim()} ${
                          right ? "mt-3 max-w-2xl text-xl sm:mt-4 sm:text-2xl" : "mt-4 max-w-3xl text-2xl sm:mt-6 sm:text-4xl"
                        }`}
                        style={animDelay(320)}
                      >
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.link_text && banner.link_url && (
                      <span
                        className={`block ${anim()}`}
                        style={animDelay(490)}
                      >
                        <Link
                          href={banner.link_url}
                          className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-gray-900 bg-white px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-900 transition-colors duration-500 ease-in-out hover:bg-gray-900 hover:text-white sm:mt-8 sm:px-10 sm:py-3 sm:text-sm"
                        >
                          {banner.link_text}
                        </Link>
                      </span>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        ))}

        {!hideLoader && (
          <div
            className={`fixed inset-0 z-[80] flex items-center justify-center bg-white transition-opacity duration-[900ms] ${
              imagesReady ? "opacity-0" : "opacity-100"
            }`}
          >
            <CoffeeLoader />
          </div>
        )}

        {banners.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors duration-500 ease-in-out hover:bg-[#C8102E] sm:flex"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Siguiente"
              className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors duration-500 ease-in-out hover:bg-[#C8102E] sm:flex"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" />
              </svg>
            </button>

            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2.5 sm:bottom-8">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Ir al slide ${i + 1}`}
                  className={`h-3.5 w-3.5 rounded-full border-2 border-white transition-all ${
                    i === current ? "bg-transparent" : "bg-white"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
