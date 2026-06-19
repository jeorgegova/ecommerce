"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useState } from "react"

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

export default function ProductCard({ product, images }: ProductCardProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const currentImage = images[activeIdx] || images[0] || null

  const prev = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveIdx((i) => (i > 0 ? i - 1 : images.length - 1))
  }, [images.length])

  const next = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))
  }, [images.length])

  const salePrice = product.sale_price && product.promotion_active ? product.sale_price : null

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-md transition-all block"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        {currentImage ? (
          <Image
            src={currentImage}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">Sin imagen</div>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Anterior"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Siguiente"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setActiveIdx(i) }}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === activeIdx ? "bg-white shadow" : "bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-3">
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
}
