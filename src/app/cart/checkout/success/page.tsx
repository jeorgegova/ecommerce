"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useMemo } from "react"

function SuccessContent() {
  const params = useSearchParams()
  const order = useMemo(() => {
    try { return JSON.parse(params.get("order") || "{}") as { order_number?: string; total?: number } } catch { return {} }
  }, [params])
  const orderNumber = order.order_number || params.get("order") || "Pedido registrado"

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#C8102E]">Pedido recibido</p>
      <h1 className="mt-3 text-3xl font-bold text-gray-900">Gracias por tu compra</h1>
      <p className="mt-4 text-gray-600">Hemos recibido tus datos. Conserva este número para consultar tu pedido:</p>
      <p className="mt-5 rounded-xl bg-gray-50 px-5 py-4 font-mono text-lg font-semibold text-gray-900">{orderNumber}</p>
      <p className="mt-4 text-sm text-gray-500">Te contactaremos con la información de pago y entrega al correo que registraste.</p>
      <Link href="/products" className="mt-8 inline-block rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800">Seguir comprando</Link>
    </div>
  )
}

export default function GuestCheckoutSuccessPage() {
  return <StoreLayout><Suspense fallback={<p className="py-24 text-center text-gray-600">Cargando confirmación...</p>}><SuccessContent /></Suspense></StoreLayout>
}
