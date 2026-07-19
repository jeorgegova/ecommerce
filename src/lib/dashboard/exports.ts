import { createClient } from "@/lib/supabase/client"

function getSupabase() {
  return createClient()
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatCOP(value: number) {
  return "$" + Math.round(value).toLocaleString("es-CO")
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function colombiaDate() {
  return new Date().toLocaleDateString("es-CO").replace(/\//g, "-")
}

// ───── PDF ─────

export async function exportSalesPDF() {
  const { jsPDF } = await import("jspdf")
  await import("jspdf-autotable")

  const supabase = getSupabase()
  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, total, status, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(200)

  const doc = new jsPDF()
  const title = "Reporte de Ventas"
  const subtitle = `Generado el ${new Date().toLocaleString("es-CO")}`

  doc.setFontSize(18)
  doc.text(title, 14, 22)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(subtitle, 14, 30)

  const rows =
    orders?.map((o) => [
      o.order_number,
      formatDate(o.created_at),
      o.status,
      formatCOP(o.total),
    ]) || []

  ;(doc as any).autoTable({
    startY: 38,
    head: [["Pedido", "Fecha", "Estado", "Total"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [17, 24, 39], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 3 },
  })

  const total = orders?.reduce((s, o) => s + Number(o.total), 0) || 0
  const finalY = (doc as any).lastAutoTable?.finalY || 38
  doc.setFontSize(10)
  doc.setFont("Helvetica", "bold")
  doc.text(`Total: ${formatCOP(total)}`, 14, finalY + 12)

  downloadBlob(doc.output("blob"), `ventas-${colombiaDate()}.pdf`)
}

export async function exportMonthlyReport() {
  const { jsPDF } = await import("jspdf")
  await import("jspdf-autotable")

  const supabase = getSupabase()
  const [kpisRes, ordersRes, productsRes] = await Promise.all([
    supabase.rpc("get_dashboard_kpis", { p_days: 30 }),
    supabase
      .from("orders")
      .select("order_number, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("products")
      .select("name, stock, sales_count")
      .eq("status", "active")
    ,
  ])

  const doc = new jsPDF()
  const title = "Reporte Mensual"
  const subtitle = `Generado el ${new Date().toLocaleString("es-CO")}`

  doc.setFontSize(18)
  doc.text(title, 14, 22)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(subtitle, 14, 30)

  const kpis = kpisRes.data as Record<string, { value: number; previous: number; label: string }> | null
  if (kpis) {
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.setFont("Helvetica", "bold")
    doc.text("Indicadores principales", 14, 42)
    doc.setFont("Helvetica", "normal")
    doc.setFontSize(8)
    let y = 50
    Object.entries(kpis).slice(0, 6).forEach(([key, k]) => {
      doc.text(`${k.label}: ${formatCOP(k.value)}`, 14, y)
      y += 6
    })
    ;(doc as any).autoTable({
      startY: y + 4,
      head: [["Pedido", "Fecha", "Estado", "Total"]],
      body: (ordersRes.data || []).map((o) => [
        o.order_number,
        formatDate(o.created_at),
        o.status,
        formatCOP(o.total),
      ]),
      theme: "grid",
      headStyles: { fillColor: [17, 24, 39], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
    })
  }

  downloadBlob(doc.output("blob"), `reporte-mensual-${colombiaDate()}.pdf`)
}

// ───── Excel ─────

export async function exportSalesExcel() {
  const XLSX = await import("xlsx")

  const supabase = getSupabase()
  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, total, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500)

  const data = (orders || []).map((o) => ({
    Pedido: o.order_number,
    Fecha: formatDate(o.created_at),
    Estado: o.status,
    Total: Number(o.total),
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, "Ventas")
  XLSX.writeFile(wb, `ventas-${colombiaDate()}.xlsx`)
}

export async function exportOrdersExcel() {
  const XLSX = await import("xlsx")

  const supabase = getSupabase()
  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, subtotal, shipping_cost, discount, total, status, created_at, paid_at")
    .order("created_at", { ascending: false })
    .limit(500)

  const data = (orders || []).map((o) => ({
    Pedido: o.order_number,
    Fecha: formatDate(o.created_at),
    Subtotal: Number(o.subtotal),
    Envío: Number(o.shipping_cost),
    Descuento: Number(o.discount),
    Total: Number(o.total),
    Estado: o.status,
    Pagado: o.paid_at ? "Sí" : "No",
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, "Pedidos")
  XLSX.writeFile(wb, `pedidos-${colombiaDate()}.xlsx`)
}

export async function exportInventoryExcel() {
  const XLSX = await import("xlsx")

  const supabase = getSupabase()
  const { data: products } = await supabase
    .from("products")
    .select("name, sku, stock, base_price, sale_price, cost_price, sales_count, status")
    .eq("status", "active")

  const data = (products || []).map((p) => ({
    Producto: p.name,
    SKU: p.sku,
    Stock: p.stock,
    "Precio base": Number(p.base_price),
    "Precio venta": Number(p.sale_price || 0),
    "Costo": Number(p.cost_price || 0),
    "Ganancia unitaria": Number((p.sale_price || p.base_price) - (p.cost_price || 0)),
    Ventas: p.sales_count,
    Estado: p.status,
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, "Inventario")
  XLSX.writeFile(wb, `inventario-${colombiaDate()}.xlsx`)
}
