"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
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
}

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
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

  if (banners.length === 0) return null

  return (
    <section
      className="relative w-full overflow-hidden bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-[62vh] min-h-[380px] w-full sm:h-[78vh] sm:min-h-[520px]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === current ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
            aria-hidden={i !== current}
          >
            <img
              src={banner.image_url}
              alt={banner.title || "Banner promocional"}
              className="hidden h-full w-full object-cover sm:block"
              fetchPriority={i === 0 ? "high" : undefined}
            />
            <img
              src={banner.mobile_image_url || banner.image_url}
              alt={banner.title || "Banner promocional"}
              className="h-full w-full object-cover sm:hidden"
              fetchPriority={i === 0 ? "high" : undefined}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              {banner.title && (
                <h2 className="max-w-5xl text-5xl font-extrabold uppercase leading-none tracking-tight text-[#C8102E] sm:text-7xl lg:text-8xl">
                  {banner.title}
                </h2>
              )}
              {banner.subtitle && (
                <p className="mt-4 max-w-3xl text-2xl font-bold text-white drop-shadow-md sm:mt-6 sm:text-4xl">
                  {banner.subtitle}
                </p>
              )}
              {banner.link_text && banner.link_url && (
                <Link
                  href={banner.link_url}
                  className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-gray-900 bg-white px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-900 transition-colors duration-200 hover:bg-gray-900 hover:text-white sm:mt-10 sm:px-10 sm:py-3 sm:text-sm"
                >
                  {banner.link_text}
                </Link>
              )}
            </div>
          </div>
        ))}

        {banners.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40 sm:flex"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Siguiente"
              className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40 sm:flex"
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
