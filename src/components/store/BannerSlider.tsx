"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useCallback } from "react"

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
  const supabase = createClient()

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase.from("active_banners").select("*")
      if (data) setBanners(data)
    }
    fetchBanners()
  }, [supabase])

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length)
  }, [banners.length])

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [banners.length, next])

  if (banners.length === 0) return null

  const banner = banners[current]

  return (
    <div className="relative w-full overflow-hidden bg-gray-100">
      <div className="relative mx-auto max-w-7xl">
        <Link
          href={banner.link_url || "#"}
          className="relative block aspect-[21/9] w-full sm:aspect-[3/1] lg:aspect-[4/1]"
        >
          <img
            src={banner.image_url}
            alt={banner.title || "Banner promocional"}
            className="hidden h-full w-full object-cover sm:block"
          />
          {banner.mobile_image_url && (
            <img
              src={banner.mobile_image_url}
              alt={banner.title || "Banner promocional"}
              className="h-full w-full object-cover sm:hidden"
            />
          )}
          {!banner.mobile_image_url && (
            <img
              src={banner.image_url}
              alt={banner.title || "Banner promocional"}
              className="h-full w-full object-cover sm:hidden"
            />
          )}

          {(banner.title || banner.subtitle) && (
            <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/50 to-transparent px-6 sm:px-12">
              {banner.title && (
                <h2 className="max-w-md text-xl font-bold text-white sm:text-3xl lg:text-4xl">
                  {banner.title}
                </h2>
              )}
              {banner.subtitle && (
                <p className="mt-1 max-w-md text-sm text-white/90 sm:mt-2 sm:text-lg">
                  {banner.subtitle}
                </p>
              )}
              {banner.link_text && banner.link_url && (
                <span className="mt-3 inline-flex w-fit rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-900 transition-colors hover:bg-gray-100 sm:mt-4 sm:text-sm">
                  {banner.link_text}
                </span>
              )}
            </div>
          )}
        </Link>

        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-4">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all sm:h-2 ${
                  i === current
                    ? "w-6 bg-white sm:w-8"
                    : "w-1.5 bg-white/50 hover:bg-white/75 sm:w-2"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
