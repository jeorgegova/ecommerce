"use client"

import { useEffect, useState } from "react"

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      className={`group fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gray-500/60 text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-[#C8102E] hover:text-white ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg className="h-5 w-5 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
      </svg>
    </button>
  )
}
