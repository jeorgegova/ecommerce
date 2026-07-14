import StoreLayout from "@/components/layout/StoreLayout"
import ProductCard from "@/components/store/ProductCard"
import MobileFilterChips from "@/components/store/MobileFilterChips"
import { createClient } from "@/lib/supabase/server"
export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from("product_listing").select("*").order("created_at", { ascending: false })
  const { data: categories } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true })

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

  const roots = (categories || []).filter((c) => !c.parent_id)

  const mobileChips = [

    ...roots.map((cat) => ({
      label: cat.name,
      href: `/categories/${cat.slug}`,
      active: false,
    })),
    { label: "En oferta", href: "/search?on_sale=true", active: false },
    { label: "Novedades", href: "/products?sort=newest", active: false },
  ]

  return (
    <StoreLayout>
      <MobileFilterChips chips={mobileChips} />

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 lg:py-12 lg:px-8">
        <h1 className="text-xl font-bold text-gray-900 lg:text-3xl">Productos</h1>
        <p className="mt-0.5 text-xs text-gray-600 lg:mt-2 lg:text-base">{products?.length || 0} productos disponibles</p>
        <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2 lg:mt-8 lg:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {products?.map((product: any) => (
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
                category_name: product.category_name,
              }}
              images={productImagesMap[product.id] || (product.main_image ? [product.main_image] : [])}
            />
          ))}
        </div>
      </div>
    </StoreLayout>
  )
}
