import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name")
  const roots = categories?.filter((c) => !c.parent_id) || []

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roots.map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.slug}`} className="rounded-xl border border-gray-200 p-6 hover:border-gray-300">
              <h2 className="text-lg font-semibold text-gray-900">{cat.name}</h2>
              {cat.description && <p className="mt-1 text-sm text-gray-600">{cat.description}</p>}
            </Link>
          ))}
        </div>
      </div>
    </StoreLayout>
  )
}
