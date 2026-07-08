"use client"

import Link from "next/link"
import { useRef, useEffect, useState } from "react"

interface ChipItem {
  label: string
  href: string
  active: boolean
}

export default function MobileFilterChips({ chips }: { chips: ChipItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const checkScroll = () => {
      setShowLeftShadow(el.scrollLeft > 4)
      setShowRightShadow(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }

    checkScroll()
    el.addEventListener("scroll", checkScroll, { passive: true })
    window.addEventListener("resize", checkScroll)
    return () => {
      el.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [chips])

  return (
    <div className="relative lg:hidden">
      {showLeftShadow && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
      )}
      {showRightShadow && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />
      )}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-2.5 -mx-4 px-4"
      >
        {chips.map((chip) => (
          <Link
            key={`${chip.label}-${chip.href}`}
            href={chip.href}
            className={`inline-flex flex-shrink-0 touch-target items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 ${
              chip.active
                ? "bg-gray-900 text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 active:bg-gray-50"
            }`}
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
