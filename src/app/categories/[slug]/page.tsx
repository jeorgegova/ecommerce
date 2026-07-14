import StoreLayout from "@/components/layout/StoreLayout"
import ProductCard from "@/components/store/ProductCard"
import MobileFilterChips from "@/components/store/MobileFilterChips"
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
  const { data: allCategories } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order")

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

  const roots = (allCategories || []).filter((c) => !c.parent_id)

  const mobileChips = [
    { label: "Todas", href: "/categories", active: false },
    ...roots.map((cat) => ({
      label: cat.name,
      href: `/categories/${cat.slug}`,
      active: cat.slug === slug,
    })),
    { label: "En oferta", href: "/search?on_sale=true", active: false },
  ]

  return (
    <StoreLayout>
      <MobileFilterChips chips={mobileChips} />

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 lg:py-12 lg:px-8">
        <Link href="/categories" className="text-sm text-gray-500 hover:text-gray-900">← Categorías</Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900 lg:mt-2 lg:text-3xl">{category.name}</h1>
        {children && children.length > 0 && (
          <div className="mt-4 lg:mt-8">
            <h2 className="text-base font-semibold text-gray-900 lg:text-lg">Subcategorías</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-4 lg:gap-4 lg:grid-cols-4">
              {children.map((child) => (
                <Link key={child.id} href={`/categories/${child.slug}`} className="rounded-lg border border-gray-200 p-4 hover:border-gray-300">
                  <h3 className="font-medium text-gray-900">{child.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 lg:mt-8">
          <h2 className="text-base font-semibold text-gray-900 lg:text-lg">Productos</h2>
          {products && products.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 lg:mt-4 lg:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
            <p className="mt-3 text-gray-500 lg:mt-4">No hay productos en esta categoría.</p>
          )}
        </div>
      </div>
    </StoreLayout>
  )
}
