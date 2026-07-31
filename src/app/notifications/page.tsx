"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  body?: string | null
  reference_type: string | null
  reference_id: string | null
  action_url: string | null
  is_read: boolean
  priority: string
  created_at: string
  read_at: string | null
}

type FilterType = "all" | "unread" | "question_created" | "question_answered" | "order_updated" | "system"

const filterLabels: Record<FilterType, string> = {
  all: "Todas",
  unread: "No leídas",
  question_created: "Preguntas",
  question_answered: "Respuestas",
  order_updated: "Pedidos",
  system: "Sistema",
}

const typeIcon: Record<string, { bg: string; icon: React.ReactNode }> = {
  question_created: {
    bg: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  question_answered: {
    bg: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  order_updated: {
    bg: "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  system: {
    bg: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
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
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`
  return new Date(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short" })
}

function groupByDate(items: Notification[]): { label: string; items: Notification[] }[] {
  const now = new Date()
  const today: Notification[] = []
  const yesterday: Notification[] = []
  const thisWeek: Notification[] = []
  const thisMonth: Notification[] = []
  const older: Notification[] = []

  items.forEach((item) => {
    const d = new Date(item.created_at)
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) today.push(item)
    else if (diffDays === 1) yesterday.push(item)
    else if (diffDays < 7) thisWeek.push(item)
    else if (diffDays < 30) thisMonth.push(item)
    else older.push(item)
  })

  const groups: { label: string; items: Notification[] }[] = []
  if (today.length) groups.push({ label: "Hoy", items: today })
  if (yesterday.length) groups.push({ label: "Ayer", items: yesterday })
  if (thisWeek.length) groups.push({ label: "Esta semana", items: thisWeek })
  if (thisMonth.length) groups.push({ label: "Este mes", items: thisMonth })
  if (older.length) groups.push({ label: "Anteriores", items: older })
  return groups
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>("all")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100)
      if (data) setNotifications(data)
      setLoading(false)
    }
    fetch()
  }, [supabase])

  useEffect(() => {
    const close = () => setMenuOpen(null)
    if (menuOpen) document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [menuOpen])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: notifications.length, unread: 0 }
    notifications.forEach((n) => {
      if (!n.is_read) c.unread++
      c[n.type] = (c[n.type] || 0) + 1
    })
    return c
  }, [notifications])

  const filtered = useMemo(() => {
    if (filter === "all") return notifications
    if (filter === "unread") return notifications.filter((n) => !n.is_read)
    return notifications.filter((n) => n.type === filter)
  }, [notifications, filter])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const markAsRead = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.rpc("mark_all_notifications_read", { p_user_id: user.id })
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
  }

  const deleteAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.rpc("delete_read_notifications", { p_user_id: user.id })
    setNotifications((prev) => prev.filter((n) => !n.is_read))
  }

  const deleteOne = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("notifications").delete().eq("id", id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleClick = async (n: Notification) => {
    await markAsRead(n.id)
    if (n.action_url) router.push(n.action_url)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[28px]">Notificaciones</h1>
          <p className="mt-1.5 text-sm text-gray-500">Mantente al día con la actividad de tu cuenta</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {counts.unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:ring-gray-300"
              >
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Marcar todas como leídas
              </button>
            )}
            <button
              onClick={deleteAllRead}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:ring-gray-300"
            >
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Eliminar leídas
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
        {/* Filters — mobile horizontal chips */}
        <aside className="w-full shrink-0 lg:w-56">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-gray-200/80 lg:bg-white lg:p-2 lg:shadow-sm">
            {(Object.keys(filterLabels) as FilterType[]).map((key) => {
              const count = counts[key] || 0
              if (key !== "all" && key !== "unread" && count === 0) return null
              const active = filter === key
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex shrink-0 items-center justify-between gap-3 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all lg:rounded-xl lg:px-3 ${
                    active
                      ? "bg-gray-900 text-white shadow-sm lg:bg-gray-900"
                      : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 lg:bg-transparent lg:ring-0 lg:hover:bg-gray-50"
                  }`}
                >
                  <span>{filterLabels[key]}</span>
                  <span
                    className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums ${
                      active ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* List */}
        <section className="min-w-0 flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-200 bg-white py-20 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <p className="mt-5 text-base font-semibold text-gray-700">No tienes notificaciones</p>
              <p className="mt-1 text-sm text-gray-400">Todo está al día</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-gray-200 bg-white py-16 shadow-sm">
              <p className="text-sm font-medium text-gray-500">No hay notificaciones en este filtro</p>
            </div>
          ) : (
            <div className="space-y-7">
              {grouped.map((group) => (
                <div key={group.label}>
                  <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {group.label}
                  </h2>
                  <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                    {group.items.map((n, idx) => {
                      const iconConf = typeIcon[n.type] || typeIcon.system
                      return (
                        <div
                          key={n.id}
                          className={`group relative transition-colors ${
                            idx !== 0 ? "border-t border-gray-100" : ""
                          } ${!n.is_read ? "bg-blue-50/40" : "bg-white hover:bg-gray-50/80"}`}
                        >
                          <div className="flex gap-3.5 p-4 sm:gap-4 sm:p-5">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconConf.bg}`}>
                              {iconConf.icon}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleClick(n)}
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[14px] font-semibold text-gray-900 sm:text-[15px]">{n.title}</p>
                                    {!n.is_read && (
                                      <span className="rounded-full bg-blue-600 px-2 py-px text-[10px] font-semibold text-white">
                                        Nueva
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-[13px] leading-relaxed text-gray-500 sm:text-[14px]">
                                    {n.message || n.body || ""}
                                  </p>
                                  <p className="mt-2 text-[12px] text-gray-400">{timeAgo(n.created_at)}</p>
                                </button>

                                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setMenuOpen(menuOpen === n.id ? null : n.id)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                    aria-label="Más opciones"
                                  >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                      <circle cx="5" cy="12" r="1.5" />
                                      <circle cx="12" cy="12" r="1.5" />
                                      <circle cx="19" cy="12" r="1.5" />
                                    </svg>
                                  </button>
                                  {menuOpen === n.id && (
                                    <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg shadow-gray-200/50">
                                      {!n.is_read && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            markAsRead(n.id)
                                            setMenuOpen(null)
                                          }}
                                          className="flex w-full px-3.5 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                                        >
                                          Marcar como leída
                                        </button>
                                      )}
                                      {n.action_url && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleClick(n)
                                            setMenuOpen(null)
                                          }}
                                          className="flex w-full px-3.5 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                                        >
                                          Ver detalle
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          deleteOne(n.id)
                                          setMenuOpen(null)
                                        }}
                                        className="flex w-full px-3.5 py-2 text-left text-[13px] text-red-600 hover:bg-red-50"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {n.action_url && (
                                <button
                                  type="button"
                                  onClick={() => handleClick(n)}
                                  className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 transition-colors hover:text-blue-700"
                                >
                                  {n.type === "question_created"
                                    ? "Responder ahora"
                                    : n.type === "question_answered"
                                      ? "Ver respuesta"
                                      : "Ver detalle"}
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
