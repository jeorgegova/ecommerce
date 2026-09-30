"use client"

import { useCartStore } from "@/stores/cart"
import { getDisplayImageUrl, isSupabaseStorageUrl } from "@/lib/utils/image"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"

export default function FlyToCartLayer() {
  const flights = useCartStore((state) => state.flights)
  const landFlight = useCartStore((state) => state.landFlight)

  if (flights.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {flights.map((flight) => (
          <motion.div
            key={flight.token}
            className="absolute left-0 top-0 flex items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_10px_30px_-8px_rgba(17,17,17,0.35)] ring-1 ring-gray-900/10"
            style={{ width: flight.thumb, height: flight.thumb, marginLeft: -flight.thumb / 2, marginTop: -flight.thumb / 2 }}
            initial={{ x: flight.from.x, y: flight.from.y, scale: 1, opacity: 0, rotate: 0 }}
            animate={{ x: flight.to.x, y: flight.to.y, scale: flight.scale, opacity: [0, 1, 1, 0], rotate: -10 }}
            transition={{
              duration: 0.62,
              ease: [0.32, 0, 0.2, 1],
              opacity: { duration: 0.62, times: [0, 0.14, 0.78, 1] },
            }}
            onAnimationComplete={() => landFlight(flight.token)}
          >
            {flight.image ? (
              <Image
                src={getDisplayImageUrl(flight.image)}
                alt={flight.name}
                width={flight.thumb}
                height={flight.thumb}
                unoptimized={!isSupabaseStorageUrl(flight.image)}
                className="h-full w-full object-cover"
              />
            ) : (
              <svg className="h-1/2 w-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3l1.5-6.75H5.197m2.303 10.5H7.5m4.5 0a3 3 0 01-3-3m6 0a3 3 0 01-3 3m0 0v1.5a1.5 1.5 0 01-3 0v-1.5"
                />
              </svg>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}