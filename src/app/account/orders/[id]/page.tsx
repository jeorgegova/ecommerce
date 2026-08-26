"use client"

import { createClient } from "@/lib/supabase/client"
import { downloadProformaPdf } from "@/lib/utils/proforma-pdf"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

interface Order {
  id: string; order_number: string; status: string; subtotal: number
  shipping_cost: number; discount: number; total: number; notes: string | null
  shipping_address_id: string | null; shipping_address: ShippingAddress | null; created_at: string; updated_at: string
  order_statuses: { name: string; color: string } | null
}

interface ShippingAddress {
  full_name: string
  phone: string | null
  address_line_1: string
  city: string
  state: string
}

interface OrderItem {
  id: string; product_id: string; variant_id: string | null
  product_name: string; product_sku: string; variant_name: string | null
  unit_price: number; quantity: number; subtotal: number; image_url?: string | null
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: o } = await supabase.from("orders").select("*, order_statuses(name, color)").eq("id", id).single()
      if (o?.shipping_address_id && !o.shipping_address) {
        const { data: address } = await supabase.from("addresses").select("*").eq("id", o.shipping_address_id).maybeSingle()
        if (address) o.shipping_address = address
      }
      if (o) setOrder(o)

      const { data: i } = await supabase.from("order_items").select("*").eq("order_id", id)
      if (i) {
        const productIds = i.map((item) => item.product_id)
        const { data: images } = productIds.length
          ? await supabase.from("product_images").select("product_id, url, is_main").in("product_id", productIds)
          : { data: [] }
        const imageMap = (images || []).reduce<Record<string, string>>((map, image) => {
          if (!map[image.product_id] || image.is_main) map[image.product_id] = image.url
          return map
        }, {})
        setItems(i.map((item) => ({ ...item, image_url: imageMap[item.product_id] || null })))
      }

      setLoading(false)
    }
    fetchOrder()
  }, [supabase, id])

  if (loading) return <p className="text-center py-24 text-gray-600">Cargando...</p>
  if (!order) return <p className="text-center py-24 text-gray-500">Pedido no encontrado</p>

  const addr = order.shipping_address

  const downloadProforma = async () => {
    setDownloading(true)
    setDownloadError("")

    try {
      const [{ data: userData }, { data: addressData }, { data: settings }] = await Promise.all([
        supabase.auth.getUser(),
        order.shipping_address_id
          ? supabase.from("addresses").select("*").eq("id", order.shipping_address_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("settings").select("key, value").in("key", [
          "store_name", "store_phone", "store_email", "store_address", "store_website",
          "banco_consignar", "numero_cuenta_bancaria", "tipo_cuenta_bancaria",
          "titular_cuenta_bancaria", "documento_cuenta_bancaria", "metodo_pago",
          "metodo_envio", "terminos_proforma",
        ]),
      ])

      const settingValue = (key: string, fallback = "") => {
        const value = settings?.find((setting) => setting.key === key)?.value
        if (value === undefined || value === null) return fallback
        if (typeof value !== "string") return String(value)
        try {
          const parsed = JSON.parse(value)
          return typeof parsed === "string" ? parsed : value
        } catch {
          return value
        }
      }

      const shippingAddress = addr || addressData
      if (!shippingAddress) throw new Error("Este pedido no tiene dirección de envío")

      await downloadProformaPdf({
        orderNumber: order.order_number,
        createdAt: order.created_at,
        status: order.status,
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shipping_cost),
        discount: Number(order.discount),
        total: Number(order.total),
        items,
        customerName: shippingAddress.full_name,
        customerEmail: userData.user?.email,
        customerPhone: shippingAddress.phone,
        address: shippingAddress.address_line_1,
        city: shippingAddress.city,
        state: shippingAddress.state,
        bankName: settingValue("banco_consignar"),
        bankAccount: settingValue("numero_cuenta_bancaria"),
        bankType: settingValue("tipo_cuenta_bancaria"),
        bankHolder: settingValue("titular_cuenta_bancaria"),
        bankDocument: settingValue("documento_cuenta_bancaria"),
        paymentMethod: settingValue("metodo_pago", "Transferencia bancaria"),
        shippingMethod: settingValue("metodo_envio"),
        storeName: settingValue("store_name", "Willy Motos"),
        storePhone: settingValue("store_phone"),
        storeEmail: settingValue("store_email"),
        storeAddress: settingValue("store_address"),
        storeWebsite: settingValue("store_website"),
        terms: settingValue("terminos_proforma"),
      })
    } catch (error: unknown) {
      setDownloadError(error instanceof Error ? error.message : "No se pudo descargar la proforma")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
        <span aria-hidden="true">←</span> Mis pedidos
      </Link>

      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Detalle del pedido</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{order.order_number}</h1>
            <p className="mt-2 text-sm text-gray-500">
              Realizado el {new Date(order.created_at).toLocaleDateString("es-CR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold"
              style={{ borderColor: order.order_statuses?.color || "#D1D5DB", color: order.order_statuses?.color || "#4B5563" }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: order.order_statuses?.color || "#9CA3AF" }} />
              {order.order_statuses?.name || order.status}
            </span>
            <button onClick={downloadProforma} disabled={downloading}
              className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-wait disabled:opacity-50">
              <span aria-hidden="true">↓</span>
              {downloading ? "Generando..." : "Descargar proforma"}
            </button>
          </div>
        </div>
        {downloadError && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{downloadError}</p>}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-bold text-gray-950">Productos del pedido</h2>
                <p className="mt-1 text-xs text-gray-500">{items.length} {items.length === 1 ? "producto" : "productos"}</p>
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Detalle</span>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 px-5 py-5 sm:px-6">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100" aria-hidden="true">
                    {item.image_url ? (
                      <Image src={item.image_url} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25M21 7.5v9L12 21m0-8.25L3 7.5m9 5.25v9M3 7.5v9l9 5.25" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <div>
                        <h3 className="font-semibold leading-snug text-gray-950">{item.product_name}</h3>
                        {item.variant_name && <p className="mt-1 text-sm text-gray-500">{item.variant_name}</p>}
                        <p className="mt-2 text-xs text-gray-400">SKU {item.product_sku} · Cantidad {item.quantity}</p>
                      </div>
                      <p className="font-bold text-gray-950">₡{Number(item.subtotal).toLocaleString("es-CR")}</p>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">₡{Number(item.unit_price).toLocaleString("es-CR")} por unidad</p>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="px-6 py-10 text-center text-sm text-gray-500">No hay productos asociados a este pedido.</p>}
            </div>
          </section>

          {addr && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-950 text-white" aria-hidden="true">⌖</div>
                <div>
                  <h2 className="font-bold text-gray-950">Dirección de entrega</h2>
                  <p className="mt-1 text-sm text-gray-500">Información utilizada para este pedido</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Destinatario</p><p className="mt-1 font-medium text-gray-900">{addr.full_name}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Teléfono</p><p className="mt-1 font-medium text-gray-900">{addr.phone || "Pendiente de configuración"}</p></div>
                <div className="sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Dirección</p><p className="mt-1 font-medium text-gray-900">{addr.address_line_1}</p><p className="mt-1 text-gray-500">{addr.city}, {addr.state}</p></div>
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-950 shadow-sm sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Resumen de pago</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-gray-500">Subtotal</span><span>₡{Number(order.subtotal).toLocaleString("es-CR")}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Envío</span><span>{Number(order.shipping_cost) > 0 ? `₡${Number(order.shipping_cost).toLocaleString("es-CR")}` : "Por calcular"}</span></div>
              {order.discount > 0 && <div className="flex justify-between gap-4"><span className="text-gray-500">Descuento</span><span>-₡{Number(order.discount).toLocaleString("es-CR")}</span></div>}
            </div>
            <div className="mt-5 border-t border-gray-200 pt-5">
              <div className="flex items-end justify-between gap-4"><span className="font-semibold">Total</span><span className="text-2xl font-bold tracking-tight">₡{Number(order.total).toLocaleString("es-CR")}</span></div>
              <p className="mt-2 text-right text-xs text-gray-500">Valores expresados en pesos colombianos</p>
            </div>
          </section>
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 text-sm shadow-sm">
            <p className="font-bold text-gray-950">¿Necesitas ayuda?</p>
            <p className="mt-1 leading-relaxed text-gray-500">Conserva tu número de pedido para cualquier consulta sobre entrega o pago.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
