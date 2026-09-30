"use client"

import { useCartStore } from "@/stores/cart"
import { motion } from "framer-motion"
import Link from "next/link"
import { useEffect } from "react"

export default function CartBadge({ className, onClick, showLabel }: { className?: string; onClick?: () => void; showLabel?: boolean }) {
  const lines = useCartStore((state) => state.lines)
  const pulse = useCartStore((state) => state.pulse)
  const initCart = useCartStore((state) => state.initCart)
  const count = Object.keys(lines).length

  useEffect(() => {
    void initCart()
  }, [initCart])

  return (
    <Link href="/cart" data-cart-target="" aria-label={`Carrito${count > 0 ? `, ${count} productos` : ""}`} className={`relative inline-flex items-center gap-2 ${className || ""}`} onClick={onClick}>
      <motion.span
        key={`cart-icon-${pulse}`}
        className="flex"
        initial={pulse > 0 ? { scale: 1.22 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 16 }}
      >
        <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a2.25 2.25 0 002.163-1.684l2.25-8.25A2.25 2.25 0 0020.97 2.25H5.256l-.624-2.34A1.862 1.862 0 003.636.75H2.25a.75.75 0 000 1.5zm7.5 17.25a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.75 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
        </svg>
      </motion.span>
      {showLabel && <span>Carrito</span>}
      {count > 0 && (
        <motion.span
          key={`cart-count-${pulse}`}
          initial={pulse > 0 ? { scale: 0.5 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 620, damping: 14 }}
          className="absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-900 px-1 text-[11px] font-bold text-white"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </Link>
  )
}