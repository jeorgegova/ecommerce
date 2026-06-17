import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import Link from "next/link"

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from("product_listing").select("*").order("created_at", { ascending: false })

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        <p className="mt-2 text-gray-600">{products?.length || 0} productos disponibles</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products?.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="group rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm">
              <div className="aspect-square rounded-lg bg-gray-100" />
              <div className="mt-4">
                <p className="text-xs text-gray-500">{product.category_name}</p>
                <h3 className="mt-1 font-medium text-gray-900 group-hover:text-gray-600">{product.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  {product.sale_price ? (
                    <><span className="text-lg font-semibold text-gray-900">${Number(product.sale_price).toLocaleString("es-CO")}</span><span className="text-sm text-gray-400 line-through">${Number(product.base_price).toLocaleString("es-CO")}</span></>
                  ) : (
                    <span className="text-lg font-semibold text-gray-900">${Number(product.current_price).toLocaleString("es-CO")}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </StoreLayout>
  )
}
