"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

interface ProductImage {
  id?: string
  url: string
  alt?: string | null
  is_main?: boolean
  sort_order?: number
}

export default function ProductGallery({ images }: { images: ProductImage[] }) {
  const [selected, setSelected] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const mainRef = useRef<HTMLDivElement>(null)

  const sorted = [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const current = sorted[selected] || sorted[0]

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx)
    setLightboxOpen(true)
    document.body.style.overflow = "hidden"
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = ""
  }

  const lbPrev = () => {
    setLightboxIdx((prev) => (prev > 0 ? prev - 1 : sorted.length - 1))
  }

  const lbNext = () => {
    setLightboxIdx((prev) => (prev < sorted.length - 1 ? prev + 1 : 0))
  }

  const handleMainMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainRef.current) return
    const rect = mainRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === "ArrowLeft") lbPrev()
      else if (e.key === "ArrowRight") lbNext()
      else if (e.key === "Escape") closeLightbox()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lightboxOpen, sorted.length]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (!sorted.length) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
        <div className="flex h-full items-center justify-center text-gray-400">Sin imagen</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div
          ref={mainRef}
          className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 cursor-zoom-in"
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={handleMainMouseMove}
          onClick={() => openLightbox(selected)}
        >
          <Image
            src={current.url}
            alt={current.alt || ""}
            fill
            className={`object-contain transition-transform duration-200 ${zoom ? "scale-[2]" : "scale-100"}`}
            style={zoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {sorted.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sorted.map((img, i) => (
              <button
                key={img.id || i}
                onClick={() => setSelected(i)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  i === selected ? "border-gray-900" : "border-transparent hover:border-gray-300"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || ""}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox() }}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {sorted.length > 1 && (
            <>
              <button
                onClick={lbPrev}
                className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Anterior"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={lbNext}
                className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Siguiente"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="relative w-full max-w-4xl max-h-[85vh] aspect-square">
            <Image
              src={sorted[lightboxIdx]?.url || current.url}
              alt={sorted[lightboxIdx]?.alt || ""}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">
            {lightboxIdx + 1} / {sorted.length}
          </div>
        </div>
      )}
    </>
  )
}
