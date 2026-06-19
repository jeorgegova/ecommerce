import StoreLayout from "@/components/layout/StoreLayout"
import ProductCard from "@/components/store/ProductCard"
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

  const productIds = (products || []).map((p: any) => p.id)
  let productImagesMap: Record<string, string[]> = {}
  if (productIds.length > 0) {
    const { data: allImages } = await supabase
      .from("product_images")
      .select("product_id, url")
      .in("product_id", productIds)
      .order("sort_order")
    if (allImages) {
      for (const img of allImages) {
        if (!productImagesMap[img.product_id]) productImagesMap[img.product_id] = []
        productImagesMap[img.product_id].push(img.url)
      }
    }
  }

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
              {products.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    base_price: product.base_price,
                    sale_price: product.sale_price,
                    promotion_active: product.promotion_active,
                    current_price: product.current_price,
                  }}
                  images={productImagesMap[product.id] || (product.main_image ? [product.main_image] : [])}
                />
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
