"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import FeaturedAddButton from "@/components/store/FeaturedAddButton"
import { useEffect, useState } from "react"

interface FeaturedProduct {
  id: string
  name: string
  slug: string
  current_price: number
  avg_rating: number | null
  main_image: string | null
  stock: number
  has_variants: boolean
}

export default function FeaturedProductsSection() {
  const [products, setProducts] = useState<FeaturedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("product_listing")
        .select("id, name, slug, current_price, avg_rating, main_image, stock, has_variants")
        .eq("is_featured", true)
        .eq("status", "active")
        .order("sales_count", { ascending: false })
        .limit(3)
      setProducts((data || []) as FeaturedProduct[])
      setLoading(false)
    }
    fetchProducts()
  }, [supabase])

  if (loading) return <section className="h-40 bg-[#C8102E]" />

  if (products.length === 0) {
    return (
      <section className="bg-[#C8102E] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md rounded-2xl bg-white p-12 shadow-lg shadow-black/10">
            <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875l-2.25-2.25M12 13.875l2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <h3 className="mt-4 text-sm font-extrabold uppercase tracking-wide text-gray-900">
              No hay productos disponibles
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Muy pronto encontrarás nuevos productos destacados aquí.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[#C8102E] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {products.map((p) => (
            <div key={p.id} className="rounded-2xl bg-white p-6 shadow-lg shadow-black/10">
              <Link href={`/products/${p.slug}`} className="block">
                <div className="flex h-72 items-center justify-center overflow-hidden rounded-xl bg-white">
                  {p.main_image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.main_image}
                      alt={p.name}
                      className="max-h-full object-contain transition-transform duration-300 ease-out hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-100">
                      <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                <h3 className="mt-4 text-center text-sm font-extrabold uppercase tracking-wide text-gray-900">
                  {p.name}
                </h3>

                <div className="mt-2 flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-4 w-4 ${
                        p.avg_rating && star <= Math.round(p.avg_rating)
                          ? "text-gray-900"
                          : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005z" />
                    </svg>
                  ))}
                </div>

                <p className="mt-3 text-center text-xl font-extrabold text-[#C8102E]">
                  ${p.current_price.toLocaleString("es-CO")}
                </p>
              </Link>

              <div className="mt-5 space-y-2.5">
                <FeaturedAddButton productId={p.id} stock={p.stock ?? 0} hasVariants={p.has_variants} />
                <Link
                  href={`/products/${p.slug}`}
                  className="flex h-10 items-center justify-center rounded-full bg-[#A61420] px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-200 hover:bg-[#8F111C]"
                >
                  Vista rápida
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="text-sm font-extrabold tracking-wide text-gray-900 transition-colors hover:text-white"
          >
            Ver Más
          </Link>
        </div>
      </div>
    </section>
  )
}
