"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
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

      const productMap: Record<string, any> = {}
      const profileMap: Record<string, any> = {}
      products?.forEach((p: any) => { productMap[p.id] = p })
      profiles?.forEach((p: any) => { profileMap[p.id] = p })

      setQuestions(q.map((r: any) => ({
        ...r,
        products: productMap[r.product_id] || null,
        profiles: profileMap[r.user_id] || null,
      })))
      setLoading(false)
    }
    fetch()
  }, [supabase])

  const submitAnswer = async (id: string) => {
    const answer = answerMap[id]
    if (!answer?.trim()) return

    setSubmittingId(id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("questions").update({
      answer,
      status: "answered",
      answered_by: user?.id,
      answered_at: new Date().toISOString()
    }).eq("id", id)

    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answer, status: "answered" } : q))
    setAnswerMap((prev) => ({ ...prev, [id]: "" }))
    setExpandedId(null)
    setSubmittingId(null)
  }

  const toggleVisibility = async (id: string, current: boolean) => {
    await supabase.from("questions").update({ is_public: !current }).eq("id", id)
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, is_public: !current } : q))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
      </div>
    )
  }

  const pending = questions.filter((q) => q.status === "pending")
  const answered = questions.filter((q) => q.status === "answered")

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">Preguntas</h1>
        <p className="mt-1 text-sm text-gray-500">
          {questions.length === 0
            ? "No hay preguntas todavía"
            : `${questions.length} preguntas · ${pending.length} pendientes · ${answered.length} respondidas`}
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">No hay preguntas</p>
          <p className="mt-1 text-xs text-gray-400">Las preguntas de clientes aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const isExpanded = expandedId === q.id
            const product = q.products

            return (
              <div
                key={q.id}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                  q.status === "pending"
                    ? "border-blue-100 bg-blue-50/20"
                    : "border-gray-100 bg-white"
                } ${isExpanded ? "shadow-sm" : ""}`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left"
                >
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    q.status === "pending"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-emerald-100 text-emerald-600"
                  }`}>
                    {q.status === "pending" ? "?" : "✓"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-px text-[11px] font-medium ${
                        q.status === "pending"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {q.status === "pending" ? "Pendiente" : "Respondida"}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(q.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[15px] font-medium leading-snug text-gray-900">
                      {q.question}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      {product && (
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-gray-500 hover:text-gray-900 transition-colors truncate max-w-[200px]"
                        >
                          {product.name}
                        </Link>
                      )}
                      {q.profiles?.full_name && (
                        <span className="truncate max-w-[140px]">{q.profiles.full_name}</span>
                      )}
                    </div>

                    {q.answer && !isExpanded && (
                      <p className="mt-2 text-[13px] text-gray-500 leading-relaxed line-clamp-2">
                        {q.answer}
                      </p>
                    )}
                  </div>

                  <svg
                    className={`mt-0.5 h-5 w-5 flex-shrink-0 text-gray-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {q.answer ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Respuesta</p>
                        <p className="mt-2 text-[14px] leading-relaxed text-gray-700">{q.answer}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[11px] text-gray-400">
                            Respondida el {q.answered_at ? new Date(q.answered_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : ""}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleVisibility(q.id, q.is_public) }}
                            className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
                          >
                            {q.is_public ? "Ocultar" : "Hacer visible"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Responder</p>
                        <textarea
                          value={answerMap[q.id] || ""}
                          onChange={(e) => setAnswerMap((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Escribe tu respuesta..."
                          rows={4}
                          className="mt-2 block w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-0 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="mt-4 flex items-center justify-between">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleVisibility(q.id, q.is_public) }}
                            className="text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {q.is_public ? "Visible públicamente" : "Oculta"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); submitAnswer(q.id) }}
                            disabled={!answerMap[q.id]?.trim() || submittingId === q.id}
                            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
