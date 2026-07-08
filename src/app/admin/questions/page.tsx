"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("questions").select("*, products(name, slug), profiles(full_name)").order("created_at", { ascending: false })
      setQuestions(data || []); setLoading(false)
    }
    fetch()
  }, [supabase])

  const submitAnswer = async (id: string) => {
    const answer = answerMap[id]
    if (!answer?.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("questions").update({ answer, status: "answered", answered_by: user?.id, answered_at: new Date().toISOString() }).eq("id", id)
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answer, status: "answered" } : q))
    setAnswerMap((prev) => ({ ...prev, [id]: "" }))
  }

  const toggleVisibility = async (id: string, current: boolean) => {
    await supabase.from("questions").update({ is_public: !current }).eq("id", id)
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, is_public: !current } : q))
  }

  if (loading) return <p className="text-gray-600">Cargando...</p>

  return (
    <div>
      <p className="text-sm text-gray-500">{questions.length} preguntas</p>
      <div className="mt-6 space-y-4">
        {questions.map((q: any) => (
          <div key={q.id} className={`rounded-xl border p-4 ${q.status === "pending" ? "border-yellow-200 bg-yellow-50" : "border-gray-200"}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500">{q.products?.name} — {q.profiles?.full_name}</p>
                <p className="mt-1 font-medium text-gray-900">{q.question}</p>
                {q.answer ? (
                  <div className="mt-2 rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500">Respuesta:</p>
                    <p className="text-sm text-gray-700">{q.answer}</p>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <input type="text" value={answerMap[q.id] || ""} onChange={(e) => setAnswerMap((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Escribir respuesta..." className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" />
                    <button onClick={() => submitAnswer(q.id)} className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Responder</button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => toggleVisibility(q.id, q.is_public)} className="text-xs font-medium text-gray-600">{q.is_public ? "Ocultar" : "Mostrar"}</button>
              </div>
            </div>
            <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${q.status === "pending" ? "bg-yellow-50 text-yellow-700" : q.status === "answered" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>{q.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
