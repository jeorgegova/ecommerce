import { createClient } from "@/lib/supabase/server"

export default async function sitemap() {
  const supabase = await createClient()

  const { data: products } = await supabase.from("products").select("slug, updated_at").eq("status", "active")
  const { data: categories } = await supabase.from("categories").select("slug, updated_at").eq("is_active", true)

  const staticPages = [
    { url: "https://gogi.co", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: "https://gogi.co/products", lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: "https://gogi.co/categories", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  ]

  const productPages = (products || []).map((p) => ({
    url: `https://gogi.co/products/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const categoryPages = (categories || []).map((c) => ({
    url: `https://gogi.co/categories/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...categoryPages]
}
