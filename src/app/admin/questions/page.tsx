"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "answered">("all")
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: q } = await supabase.from("questions").select("*").order("created_at", { ascending: false })
      if (!q || q.length === 0) { setQuestions([]); setLoading(false); return }
      const productIds = [...new Set(q.map((r: any) => r.product_id))]
      const userIds = [...new Set(q.map((r: any) => r.user_id))]
      const [{ data: products }, { data: profiles }] = await Promise.all([
        supabase.from("products").select("id, name, slug").in("id", productIds),
        supabase.from("profiles").select("id, full_name").in("id", userIds),
      ])
      const productMap: Record<string, any> = {}; const profileMap: Record<string, any> = {}
      products?.forEach((p: any) => { productMap[p.id] = p })
      profiles?.forEach((p: any) => { profileMap[p.id] = p })
      setQuestions(q.map((r: any) => ({ ...r, products: productMap[r.product_id] || null, profiles: profileMap[r.user_id] || null })))
      setLoading(false)
    }
    fetch()
  }, [supabase])

  const submitAnswer = async (id: string) => {
    const answer = answerMap[id]
    if (!answer?.trim()) return
    setSubmittingId(id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("questions").update({ answer, status: "answered", answered_by: user?.id, answered_at: new Date().toISOString() }).eq("id", id)
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answer, status: "answered" } : q))
    setAnswerMap((prev) => ({ ...prev, [id]: "" }))
    setSubmittingId(null)
  }

  const toggleVisibility = async (id: string, current: boolean) => {
    await supabase.from("questions").update({ is_public: !current }).eq("id", id)
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, is_public: !current } : q))
  }

  const pending = useMemo(() => questions.filter((q) => q.status === "pending"), [questions])
  const answered = useMemo(() => questions.filter((q) => q.status === "answered"), [questions])
  const filtered = useMemo(() => {
    if (filter === "pending") return pending
    if (filter === "answered") return answered
    return questions
  }, [questions, filter, pending, answered])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Preguntas</h1>
        {questions.length > 0 && (
          <div className="mt-2 flex items-center gap-4 text-[13px] text-gray-500">
            <span>{questions.length} total</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              {pending.length} pendientes
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {answered.length} respondidas
            </span>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-gray-200 bg-gray-50/40 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-4 text-[15px] font-medium text-gray-500">No hay preguntas</p>
          <p className="mt-1 text-[13px] text-gray-400">Las preguntas de clientes aparecerán aquí</p>
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="mb-6 flex gap-1 rounded-2xl bg-gray-100 p-1 w-fit">
            {(["all", "pending", "answered"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-xl px-4 py-1.5 text-[13px] font-medium transition-all ${
                  filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Respondidas"}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((q) => {
              const product = q.products
              return (
                <div
                  key={q.id}
                  className={`rounded-[18px] border bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all sm:p-6 ${
                    q.status === "pending" ? "border-blue-100" : "border-gray-100"
                  }`}
                >
                  {/* Question header */}
                  <div className="flex gap-3.5">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                      q.status === "pending" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                    }`}>
                      <span className="text-xs font-semibold">{q.status === "pending" ? "?" : "✓"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-px text-[11px] font-medium ${
                          q.status === "pending" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {q.status === "pending" ? "Pendiente" : "Respondida"}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(q.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[15px] font-semibold leading-snug text-gray-900">{q.question}</p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-400">
                        {product && (
                          <Link href={`/products/${product.slug}`} className="font-medium text-gray-500 hover:text-gray-900 transition-colors truncate max-w-[180px]">
                            {product.name}
                          </Link>
                        )}
                        {q.profiles?.full_name && (
                          <span className="truncate max-w-[120px]">{q.profiles.full_name}</span>
                        )}
                        <button
                          onClick={() => toggleVisibility(q.id, q.is_public)}
                          className="ml-auto text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {q.is_public ? "Pública" : "Oculta"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Answer / Reply form */}
                  {q.answer ? (
                    <div className="mt-4 ml-[3.25rem] border-l-2 border-blue-200 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-gray-700">Respuesta</span>
                        {q.answered_at && (
                          <span className="text-[12px] text-gray-400">
                            {new Date(q.answered_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-gray-600">{q.answer}</p>
                    </div>
                  ) : (
                    <div className="mt-4 ml-[3.25rem]">
                      <textarea
                        value={answerMap[q.id] || ""}
                        onChange={(e) => setAnswerMap((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Escribe tu respuesta..."
                        rows={3}
                        className="block w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-0 transition-colors"
                      />
                      <button
                        onClick={() => submitAnswer(q.id)}
                        disabled={!answerMap[q.id]?.trim() || submittingId === q.id}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {submittingId === q.id ? (
                          <>
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Enviando
                          </>
                        ) : (
                          "Enviar respuesta"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
