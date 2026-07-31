"use client"

import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/stores/auth-modal"
import { useEffect, useState } from "react"

interface Question {
  id: string
  question: string
  answer: string | null
  status: string
  created_at: string
  answered_at: string | null
  profiles: { full_name: string } | null
}

export default function QuestionSection({ productId, initialQuestions = [] }: { productId: string; initialQuestions?: Question[] }) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [showAll, setShowAll] = useState(false)
  const [newQuestion, setNewQuestion] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()
  const { openAuth } = useAuthModal()

  useEffect(() => {
    fetchQuestions()
  }, [productId])

  const visibleQuestions = showAll ? questions : questions.slice(0, 2)
  const hasMore = questions.length > 2

  const fetchQuestions = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from("questions")
        .select("*, profiles(full_name)")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
      if (data) setQuestions(data)
    } else {
      const { data } = await supabase
        .from("questions")
        .select("*")
        .eq("product_id", productId)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
      if (data) setQuestions(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return

    setSubmitting(true)
    setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        openAuth("login", window.location.pathname)
        setSubmitting(false)
        return
      }

      const { error: insertErr } = await supabase.from("questions").insert({
        product_id: productId,
        user_id: user.id,
        question: newQuestion.trim(),
      })

      if (insertErr) {
        setError(insertErr.message)
        setSubmitting(false)
        return
      }

      setNewQuestion("")
      setSubmitted(true)
      setSubmitting(false)
      await fetchQuestions()
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar la pregunta")
      setSubmitting(false)
    }
  }

  const count = initialQuestions.length || questions.length

  return (
    <div className="mt-16 border-t border-gray-200 pt-10">
      <h2 className="text-xl font-semibold text-gray-900">
        Preguntas {count > 0 && <span className="text-gray-400 font-normal">({count})</span>}
      </h2>

      {questions.length === 0 && !initialQuestions.length ? (
        <p className="mt-6 text-sm text-gray-500">
          No hay preguntas aún. Sé el primero en preguntar.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {visibleQuestions.map((q) => (
            <div key={q.id} className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-600">
                      Q
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{q.question}</p>
                        {q.status === "pending" && (
                          <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                            Pendiente
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {q.profiles?.full_name || "Usuario"} · {new Date(q.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {q.answer ? (
                    <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-blue-50/50 px-3.5 py-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                        R
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] leading-relaxed text-gray-700">{q.answer}</p>
                        {q.answered_at && (
                          <p className="mt-1 text-[10px] text-gray-400">
                            GoGi Motos · {new Date(q.answered_at).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-2.5">
                      <svg className="h-3.5 w-3.5 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[11px] text-blue-600">Esperando respuesta del vendedor</span>
                    </div>
                  )}
                </div>
              ))}

              {hasMore && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 py-3 text-[13px] font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                >
                  {showAll ? (
                    <>
                      Mostrar menos
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Ver las {questions.length - 2} preguntas anteriores
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-900">Hacer una pregunta</h3>

            {submitted ? (
              <div className="mt-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                Tu pregunta fue enviada. Te responderemos pronto.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-3">
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Escribe tu pregunta aquí..."
                  rows={3}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-0 transition-colors resize-none"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-500">{error}</p>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting || !newQuestion.trim()}
                    className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50"
                  >
                    {submitting ? "Enviando..." : "Enviar pregunta"}
                  </button>
                  <p className="text-xs text-gray-400">
                    Tu pregunta será visible al ser respondida.
                  </p>
                </div>
              </form>
            )}
          </div>
    </div>
  )
}
