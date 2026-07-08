"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("reviews").select("*, products(name, slug), profiles(full_name, email)").order("created_at", { ascending: false })
      setReviews(data || []); setLoading(false)
    }
    fetch()
  }, [supabase])

  const toggleApproval = async (id: string, current: boolean) => {
    await supabase.from("reviews").update({ is_approved: !current }).eq("id", id)
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, is_approved: !current } : r))
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar reseña?")) return
    await supabase.from("reviews").delete().eq("id", id)
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) return <p className="text-gray-600">Cargando...</p>

  return (
    <div>
      <p className="text-sm text-gray-500">{reviews.length} reseñas</p>
      <div className="mt-6 space-y-4">
        {reviews.map((r: any) => (
          <div key={r.id} className={`rounded-xl border p-4 ${r.is_approved ? "border-gray-200" : "border-yellow-200 bg-yellow-50"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{r.products?.name}</p>
                <p className="text-sm text-gray-500">{r.profiles?.full_name || r.profiles?.email} — {"★".repeat(r.rating)}</p>
                {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleApproval(r.id, r.is_approved)} className={`text-xs font-medium ${r.is_approved ? "text-yellow-600" : "text-green-600"}`}>
                  {r.is_approved ? "Ocultar" : "Aprobar"}
                </button>
                <button onClick={() => handleDelete(r.id)} className="text-xs font-medium text-red-500">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
