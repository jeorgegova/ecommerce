import StoreLayout from "@/components/layout/StoreLayout"
import ProductCard from "@/components/store/ProductCard"
import { createClient } from "@/lib/supabase/server"

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from("product_listing").select("*").order("created_at", { ascending: false })

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
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        <p className="mt-2 text-gray-600">{products?.length || 0} productos disponibles</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
