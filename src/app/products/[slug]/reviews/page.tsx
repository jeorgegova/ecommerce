"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProductReviewsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [productId, setProductId] = useState("")
  const [reviews, setReviews] = useState<any[]>([])
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: p } = await supabase.from("products").select("id").eq("slug", slug).single()
      if (!p) return
      setProductId(p.id)
      const { data: r } = await supabase.from("reviews").select("*, profiles(full_name)").eq("product_id", p.id).eq("is_approved", true).order("created_at", { ascending: false })
      setReviews(r || [])
    }
    fetch()
  }, [supabase, slug])

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Debes iniciar sesión"); setSaving(false); return }

    const { error: err } = await supabase.from("reviews").insert({
      product_id: productId, user_id: user.id, rating, title, comment,
    })
    if (err) { setError(err.message) } else { setTitle(""); setComment(""); setRating(5) }
    setSaving(false)
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Reseñas</h1>

        <form onSubmit={submitReview} className="mt-6 rounded-xl border border-gray-200 p-6 space-y-4">
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700">Calificación</label>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className={`h-8 w-8 rounded-full text-sm ${n <= rating ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-500"}`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Comentario</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
          </div>
          <button type="submit" disabled={saving} className="rounded-full bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">Enviar Reseña</button>
        </form>

        <div className="mt-8 space-y-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-900">{r.profiles?.full_name || "Anónimo"}</span><span className="text-xs text-yellow-500">{"★".repeat(r.rating)}</span></div>
              {r.title && <p className="mt-1 font-medium text-gray-900">{r.title}</p>}
              {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
              <p className="mt-2 text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("es-CO")}</p>
            </div>
          ))}
        </div>
      </div>
    </StoreLayout>
  )
}
