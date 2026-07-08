import ProductFilterEngine from "@/components/store/ProductFilterEngine"
import RecentlyViewed from "@/components/store/RecentlyViewed"
import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from("product_listing").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
  ])

  const productIds = (productsRes.data || []).map((p: any) => p.id)
  let initialImages: Record<string, string[]> = {}
  if (productIds.length > 0) {
    const { data: allImages } = await supabase
      .from("product_images")
      .select("product_id, url")
      .in("product_id", productIds)
      .order("sort_order")
    if (allImages) {
      for (const img of allImages) {
        if (!initialImages[img.product_id]) initialImages[img.product_id] = []
        initialImages[img.product_id].push(img.url)
      }
    }
  }

  const initialProducts = (productsRes.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    base_price: p.base_price,
    sale_price: p.sale_price,
    promotion_active: p.promotion_active,
    current_price: p.current_price,
    category_name: p.category_name,
    avg_rating: p.avg_rating,
    main_image: p.main_image || null,
  }))

  return (
    <StoreLayout>
      <div className="flex gap-6 mx-auto max-w-7xl">
        <div className="flex-1 min-w-0">
          <ProductFilterEngine
            initialProducts={initialProducts}
            initialTotal={productsRes.count || initialProducts.length}
            initialCategories={(categoriesRes.data || []) as any}
            initialImages={initialImages}
            initialSearch={params.q || ""}
          />
        </div>
        <aside className="hidden w-56 flex-shrink-0 xl:block mt-4 lg:mt-8">
          <RecentlyViewed />
        </aside>
      </div>
    </StoreLayout>
  )
}
