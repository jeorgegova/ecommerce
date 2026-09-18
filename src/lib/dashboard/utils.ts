export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO").format(value)
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  }
  return formatNumber(value)
}

export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return "$" + (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (value >= 1_000) {
    return "$" + (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  }
  return "$" + formatNumber(value)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "hace unos segundos"
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins !== 1 ? "s" : ""}`
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? "s" : ""}`
  if (diffDays < 30) return `hace ${diffDays} día${diffDays !== 1 ? "s" : ""}`
  return formatDate(dateStr)
}

export function computeGrowthPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-cyan-100 text-cyan-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  }
  return colors[status] || "bg-gray-100 text-gray-700"
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critico":
      return "bg-red-50 text-red-700 border-red-200"
    case "bajo":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "normal":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    default:
      return "bg-gray-50 text-gray-700 border-gray-200"
  }
}

export function getSeverityDot(severity: string): string {
  switch (severity) {
    case "critico":
      return "bg-red-500"
    case "bajo":
      return "bg-amber-500"
    case "normal":
      return "bg-emerald-500"
    default:
      return "bg-gray-400"
  }
}

export function getActivityIcon(icon: string): string {
  const icons: Record<string, string> = {
    "shopping-bag": "🛍️",
    "alert-triangle": "⚠️",
    "user-plus": "👤",
    "package-x": "📦",
  }
  return icons[icon] || "📌"
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
