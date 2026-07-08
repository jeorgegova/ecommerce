"use client"

import Image from "next/image"
import Link from "next/link"
import { memo, useCallback, useEffect, useRef, useState } from "react"

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    base_price: number
    sale_price: number | null
    promotion_active: boolean
    current_price: number
    category_name?: string
    avg_rating?: number
  }
  images: string[]
}

const ProductCard = memo(function ProductCard({ product, images }: ProductCardProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const cardRef = useRef<HTMLAnchorElement>(null)

  const hasImages = images.length > 0
  const hasMultiple = images.length > 1

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

  const goTo = useCallback((idx: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIdx(idx)
  }, [isTransitioning])

  const prev = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    goTo(activeIdx > 0 ? activeIdx - 1 : images.length - 1)
  }, [activeIdx, images.length, goTo])

  const next = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    goTo(activeIdx < images.length - 1 ? activeIdx + 1 : 0)
  }, [activeIdx, images.length, goTo])

  const salePrice = product.sale_price && product.promotion_active ? product.sale_price : null
  const discountPercent = salePrice && product.base_price > 0
    ? Math.round(((product.base_price - salePrice) / product.base_price) * 100) : null

  return (
    <Link
      ref={cardRef}
      href={`/products/${product.slug}`}
      className="group relative flex flex-col rounded-2xl bg-white border border-gray-100 transition-all duration-300 ease-out hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100 hover:-translate-y-0.5 active:scale-[0.98] lg:active:scale-100 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart === null || !hasMultiple) return
        const diff = e.changedTouches[0].clientX - touchStart
        if (diff > 40) prev(e as any)
        else if (diff < -40) next(e as any)
        setTouchStart(null)
      }}
    >
      <div className="relative overflow-hidden bg-gray-50">
        {hasImages ? (
          <div className="relative w-full aspect-square bg-gray-50">
            {images.map((img, idx) => (
              <Image
                key={idx}
                src={img}
                alt={product.name}
                fill
                className={`object-cover transition-all duration-400 ease-out ${
                  idx === activeIdx ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 25vw"
                priority={idx === 0}
              />
            ))}
          </div>
        ) : (
          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-gray-200 lg:h-10 lg:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        )}

        {discountPercent && (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center rounded-full bg-red-500/90 backdrop-blur-sm px-1.5 py-px text-[10px] font-semibold text-white shadow-sm lg:top-2.5 lg:left-2.5 lg:px-2 lg:py-0.5 lg:text-[11px]">
            -{discountPercent}%
          </span>
        )}

        {hasMultiple && (
          <>
            <button
              onClick={prev}
              className="absolute left-1 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:shadow-md max-lg:opacity-100 max-lg:active:scale-90 lg:h-8 lg:w-8 lg:left-2"
              aria-label="Anterior"
            >
              <svg className="h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={next}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:shadow-md max-lg:opacity-100 max-lg:active:scale-90 lg:h-8 lg:w-8 lg:right-2"
              aria-label="Siguiente"
            >
              <svg className="h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>

            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 transition-all duration-200 opacity-0 group-hover:opacity-100 lg:bottom-2.5 lg:gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.preventDefault(); goTo(idx) }}
                  className={`rounded-full transition-all duration-300 ${
                    idx === activeIdx ? "h-1 w-2.5 bg-white shadow-sm lg:h-1.5 lg:w-4" : "h-1 w-1 bg-white/60 lg:h-1.5 lg:w-1.5"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col p-1.5 lg:p-3.5">
        {product.category_name && (
          <p className="mb-0.5 hidden text-[10px] font-medium text-gray-400 uppercase tracking-wide lg:block">{product.category_name}</p>
        )}
        <h3 className="flex-1 text-[11px] font-medium text-gray-900 leading-[1.3] line-clamp-2 group-hover:text-gray-700 transition-colors lg:text-sm lg:leading-snug">
          {product.name}
        </h3>

        <div className="mt-1.5 lg:mt-2.5">
          {salePrice ? (
            <div className="flex flex-col lg:flex-row lg:items-baseline lg:gap-1.5">
              <span className="text-[13px] font-bold text-gray-900 lg:text-base">
                ${Number(salePrice).toLocaleString("es-CO")}
              </span>
              <span className="text-[10px] text-gray-400 line-through lg:text-[11px]">
                ${Number(product.base_price).toLocaleString("es-CO")}
              </span>
            </div>
          ) : (
            <span className="text-[13px] font-bold text-gray-900 lg:text-base">
              ${Number(product.current_price).toLocaleString("es-CO")}
            </span>
          )}
        </div>
        {product.avg_rating != null && product.avg_rating > 0 && (
          <span className="mt-1 hidden items-center gap-1 text-[11px] font-medium text-amber-500 lg:flex">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            {Number(product.avg_rating).toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  )
})

export default ProductCard
