import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name")
  const roots = categories?.filter((c) => !c.parent_id) || []

  // Fetch product counts for each root category
  const counts = await Promise.all(
    roots.map(async (cat) => {
      const { count } = await supabase
        .from("product_listing")
        .select("id", { count: "exact", head: true })
        .eq("category_id", cat.id)
      return count ?? 0
    })
  )
  const rootsWithCount = roots.map((cat, i) => ({ ...cat, productCount: counts[i] }))

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 lg:py-12 lg:px-8">
        <h1 className="text-xl font-bold text-gray-900 lg:text-3xl">Categorías</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:mt-8 lg:gap-6 lg:grid-cols-3">
          {rootsWithCount.map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.slug}`} className="rounded-xl border border-gray-200 p-5 hover:border-gray-300 active:bg-gray-50 lg:p-6">
              <h2 className="text-base font-semibold text-gray-900 lg:text-lg">{cat.name}</h2>
              {cat.description && <p className="mt-1 text-xs text-gray-600 lg:text-sm">{cat.description}</p>}
              <p className="mt-1 text-xs text-gray-500">{cat.productCount} productos</p>
            </Link>
          ))}
        </div>
      </div>
    </StoreLayout>
  )
}
