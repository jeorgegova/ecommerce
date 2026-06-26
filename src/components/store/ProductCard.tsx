"use client"

import Image from "next/image"
import Link from "next/link"
import { memo, useCallback, useEffect, useState } from "react"

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

  const hasImages = images.length > 0
  const hasMultiple = images.length > 1

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

  const prev = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIdx((i) => (i > 0 ? i - 1 : images.length - 1))
  }, [images.length, isTransitioning])

  const next = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))
  }, [images.length, isTransitioning])

  const salePrice = product.sale_price && product.promotion_active ? product.sale_price : null

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-in-out overflow-hidden border border-gray-200 block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        {hasImages ? (
          <div className="relative w-full aspect-square bg-gray-100">
            {images.map((img, idx) => (
              <Image
                key={idx}
                src={img}
                alt={product.name}
                fill
                className={`object-contain p-2 transition-all duration-500 ease-in-out ${
                  idx === activeIdx
                    ? "opacity-100 translate-x-0"
                    : idx < activeIdx
                      ? "opacity-0 -translate-x-full"
                      : "opacity-0 translate-x-full"
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={idx === 0}
              />
            ))}
          </div>
        ) : (
          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Sin imagen</span>
          </div>
        )}

        {isHovered && hasMultiple && (
          <>
            <button
              onClick={prev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100"
              aria-label="Anterior"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100"
              aria-label="Siguiente"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 transition-all duration-300 opacity-0 group-hover:opacity-100">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveIdx(idx)
                  }}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    idx === activeIdx ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-3">
        {product.category_name && (
          <p className="text-xs text-gray-400 mb-0.5 truncate">{product.category_name}</p>
        )}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-gray-600 leading-snug">
          {product.name}
        </h3>

        <div className="mt-1.5">
          {salePrice ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base font-semibold text-gray-900 whitespace-nowrap">
                ${Number(salePrice).toLocaleString("es-CO")}
              </span>
              <span className="text-xs text-gray-400 line-through whitespace-nowrap">
                ${Number(product.base_price).toLocaleString("es-CO")}
              </span>
            </div>
          ) : (
            <span className="text-base font-semibold text-gray-900">
              ${Number(product.current_price).toLocaleString("es-CO")}
            </span>
          )}
        </div>

        {product.avg_rating != null && product.avg_rating > 0 && (
          <p className="mt-1 text-xs text-gray-400">★ {Number(product.avg_rating).toFixed(1)}</p>
        )}
      </div>
    </Link>
  )
})

export default ProductCard
