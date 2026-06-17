import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).single()
  if (!category) notFound()

  const { data: children } = await supabase.from("categories").select("*").eq("parent_id", category.id).eq("is_active", true).order("sort_order")
  const { data: products } = await supabase.from("product_listing").select("*").eq("category_id", category.id)

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/categories" className="text-sm text-gray-500 hover:text-gray-900">← Categorías</Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{category.name}</h1>
        {children && children.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">Subcategorías</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => (
                <Link key={child.id} href={`/categories/${child.slug}`} className="rounded-lg border border-gray-200 p-4 hover:border-gray-300">
                  <h3 className="font-medium text-gray-900">{child.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
          {products && products.length > 0 ? (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`} className="group rounded-xl border border-gray-200 p-4 hover:border-gray-300">
                  <div className="aspect-square rounded-lg bg-gray-100" />
                  <h3 className="mt-3 font-medium text-gray-900 group-hover:text-gray-600">{product.name}</h3>
                  <p className="mt-1 font-semibold text-gray-900">${Number(product.current_price).toLocaleString("es-CO")}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-gray-500">No hay productos en esta categoría.</p>
          )}
        </div>
      </div>
    </StoreLayout>
  )
}
