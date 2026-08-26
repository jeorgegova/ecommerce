"use client"

import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/stores/auth-modal"
import { useEffect, useRef, useState } from "react"

interface Question {
  id: string
  question: string
  answer: string | null
  status: string
  created_at: string
  answered_at: string | null
  profiles: { full_name: string } | null
}

const CHAR_LIMIT = 500

function QuestionCard({ q }: { q: Question }) {
  return (
    <article className="group rounded-[18px] border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-250 ease-out hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-gray-200 sm:p-6">
      <div className="flex gap-3.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100" aria-hidden="true">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-snug text-gray-900 sm:text-[16px]">{q.question}</p>
          <p className="mt-1 text-[13px] text-gray-400">
            {q.profiles?.full_name || "Usuario"} · {timeAgo(q.created_at)}
          </p>
        </div>
      </div>

      {q.answer ? (
        <div className="mt-4 ml-[3.25rem] border-l-2 border-blue-200 pl-4">
          <p className="text-[14px] leading-relaxed text-gray-600">{q.answer}</p>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-gray-400">
            <span className="rounded-full bg-blue-50 px-1.5 py-px text-[10px] font-medium text-blue-600">Vendedor</span>
            {q.answered_at && `· ${timeAgo(q.answered_at)}`}
          </p>
        </div>
      ) : (
        <div className="mt-4 ml-[3.25rem] flex items-center gap-2 text-[13px] text-gray-400">
          <svg className="h-3.5 w-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Esperando respuesta del vendedor
        </div>
      )}
    </article>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days} días`
  return new Date(dateStr).toLocaleDateString("es-CR", { day: "numeric", month: "short" })
}

function avgResponseTime(questions: Question[]): string | null {
  const answered = questions.filter((q) => q.answered_at && q.created_at)
  if (answered.length === 0) return null
  const total = answered.reduce((sum, q) => {
    return sum + (new Date(q.answered_at!).getTime() - new Date(q.created_at).getTime())
  }, 0)
  const avgMin = Math.round(total / answered.length / 60000)
  if (avgMin < 60) return `${avgMin} min`
  const hours = Math.round(avgMin / 60)
  if (hours < 24) return `${hours}h`
  return `₡{Math.round(hours / 24)} días`
}

function lastAnswerTime(questions: Question[]): string | null {
  const answered = questions.filter((q) => q.answered_at)
  if (answered.length === 0) return null
  const latest = answered.reduce((max, q) =>
    new Date(q.answered_at!).getTime() > new Date(max.answered_at!).getTime() ? q : max
  )
  return timeAgo(latest.answered_at!)
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
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchQuestions()
  }, [productId])

  const alwaysVisible = questions.slice(0, 2)
  const hiddenQuestions = questions.slice(2)

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("product_id", productId)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
    if (data) setQuestions(data)
  }

  const handleToggleShow = () => {
    setShowAll((prev) => !prev)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim() || newQuestion.length > CHAR_LIMIT) return
    setSubmitting(true)
    setError("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { openAuth("login", window.location.pathname); setSubmitting(false); return }
      const { error: insertErr } = await supabase.from("questions").insert({
        product_id: productId, user_id: user.id, question: newQuestion.trim(),
      })
      if (insertErr) { setError(insertErr.message); setSubmitting(false); return }

      const optimisticQuestion: Question = {
        id: crypto.randomUUID(),
        question: newQuestion.trim(),
        answer: null,
        status: "pending",
        created_at: new Date().toISOString(),
        answered_at: null,
        profiles: { full_name: "Tú" },
      }
      setQuestions((prev) => [optimisticQuestion, ...prev])
      setNewQuestion("")
      setSubmitted(true)
      setSubmitting(false)
      fetchQuestions()
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar")
      setSubmitting(false)
    }
  }

  const avgTime = avgResponseTime(questions)
  const lastAns = lastAnswerTime(questions)

  return (
    <div className="mt-20 border-t border-gray-100 pt-12">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-gray-900 sm:text-2xl">
            Preguntas y respuestas
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-gray-500">
            ¿Tienes dudas? Haz una pregunta al vendedor
          </p>
        </div>
        {questions.length > 0 && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[13px] font-medium text-gray-600">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {questions.length} preguntas
          </span>
        )}
      </div>

      {/* Questions list */}
      {questions.length > 0 && (
        <div ref={listRef} className="mt-6 space-y-3">
          {alwaysVisible.map((q, i) => (
            <QuestionCard key={q.id} q={q} />
          ))}

          <div
            className={`overflow-hidden transition-all duration-400 ease-in-out space-y-3 ${
              showAll ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {hiddenQuestions.map((q) => (
              <QuestionCard key={q.id} q={q} />
            ))}
          </div>

          {hiddenQuestions.length > 0 && (
            <button
              onClick={handleToggleShow}
              className="mx-auto flex w-fit items-center justify-center gap-2 rounded-[18px] border border-gray-200 px-6 py-3 text-[14px] font-medium text-gray-500 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50/50 hover:text-gray-700"
              aria-expanded={showAll}
            >
              {showAll ? "Ver menos" : "Ver más"}
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${showAll ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          )}
        </div>
      )}

      {questions.length === 0 && (
        <div className="mt-8 flex flex-col items-center rounded-[18px] border border-dashed border-gray-200 bg-gray-50/40 py-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-4 text-[15px] font-medium text-gray-500">No hay preguntas aún</p>
          <p className="mt-1 text-[13px] text-gray-400">Sé el primero en preguntar sobre este producto</p>
        </div>
      )}

      {/* Ask form */}
      <div className="mt-10 rounded-[18px] border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-6">
        <h3 className="text-[16px] font-semibold text-gray-900">Haz una pregunta</h3>
        <p className="mt-1 text-[14px] text-gray-500">El vendedor responderá públicamente</p>

        {submitted ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-medium text-emerald-800">Pregunta enviada</p>
              <p className="text-[13px] text-emerald-600">Te notificaremos cuando el vendedor responda</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="relative">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Ej: ¿Este repuesto es compatible con la máquina Dixie Narco 501?"
                rows={4}
                maxLength={CHAR_LIMIT}
                className="block min-h-[120px] w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[14px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-0 transition-colors"
              />
              <span className="absolute bottom-3 right-3 text-[12px] text-gray-400">
                {newQuestion.length}/{CHAR_LIMIT}
              </span>
            </div>

            {error && (
              <p className="mt-3 text-[13px] text-red-500">{error}</p>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[12px] text-gray-400">
                Sé específico para obtener mejores respuestas
              </p>
              <button
                type="submit"
                disabled={submitting || !newQuestion.trim() || newQuestion.length > CHAR_LIMIT}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enviando
                  </>
                ) : (
                  <>
                    Enviar pregunta
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
