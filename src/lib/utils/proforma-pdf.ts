import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export interface ProformaItem {
  product_name: string
  product_sku?: string | null
  variant_name?: string | null
  quantity: number
  unit_price: number
  subtotal: number
  discount?: number | null
}

export interface ProformaData {
  orderNumber: string
  createdAt: string
  status: string
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  items: ProformaItem[]
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  bankName?: string | null
  bankAccount?: string | null
  storeName?: string | null
  storePhone?: string | null
  storeEmail?: string | null
  storeWebsite?: string | null
}

const PAGE = { left: 13, right: 13, top: 10, bottom: 287 }
const colors = { black: "#111111", gray: "#555555", muted: "#777777", light: "#CCCCCC", wash: "#F3F4F6" }
const money = (value: number) => `$${Number(value || 0).toLocaleString("es-CO")}`
type TextOptions = { align?: "left" | "center" | "right" }

export function getSettingValue(settings: { key: string; value: unknown }[] | null, key: string) {
  const row = settings?.find((item) => item.key === key)
  if (row?.value === undefined || row.value === null) return ""
  if (typeof row.value !== "string") return String(row.value)
  try {
    const parsed = JSON.parse(row.value)
    return typeof parsed === "string" ? parsed : row.value
  } catch {
    return row.value
  }
}

async function loadLogo(): Promise<string | null> {
  try {
    const response = await fetch("/logoVendingShop.png")
    const blob = await response.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function statusLabel(status: string) {
  return { pending: "Pendiente", confirmed: "Confirmado", paid: "Pagado", processing: "En preparación", shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado" }[status] || status
}

export async function downloadProformaPdf(data: ProformaData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const logo = await loadLogo()
  const text = (value: string, x: number, y: number, size = 8.5, color = colors.gray, options?: TextOptions) => {
    doc.setFontSize(size)
    doc.setTextColor(color)
    doc.text(value, x, y, options)
  }
  const label = (value: string, x: number, y: number) => {
    doc.setFont("helvetica", "bold")
    text(value, x, y, 7.5, colors.black)
    doc.setFont("helvetica", "normal")
  }

  doc.setFont("helvetica", "normal")
  if (logo) doc.addImage(logo, "PNG", PAGE.left, PAGE.top, 12, 12)
  const brandX = logo ? PAGE.left + 16 : PAGE.left
  const storeName = data.storeName?.trim() || "VendingShop"
  doc.setFont("helvetica", "bold")
  text(storeName, brandX, 16, 12, colors.black)
  text("PROFORMA", pageWidth - PAGE.right, 16, 19, colors.black, { align: "right" })
  doc.setFont("helvetica", "normal")
  text(`Pedido #${data.orderNumber}  ·  ${new Date(data.createdAt).toLocaleDateString("es-CO")}  ·  Estado: ${statusLabel(data.status)}`, PAGE.left, 28, 8.5, colors.black)
  text("Documento no constituye factura de venta", pageWidth - PAGE.right, 28, 8, colors.gray, { align: "right" })
  doc.setDrawColor(colors.light)
  doc.setLineWidth(0.25)
  doc.line(PAGE.left, 33, pageWidth - PAGE.right, 33)
  doc.setDrawColor(colors.black)
  doc.setLineWidth(0.6)
  doc.line(PAGE.left, 33, PAGE.left + 28, 33)

  label("DATOS DEL CLIENTE", PAGE.left, 41)
  const rightColumn = pageWidth / 2 + 4
  label("Cliente:", PAGE.left, 48)
  text(data.customerName?.trim() || "", PAGE.left + 16, 48, 8.5, colors.black)
  label("Teléfono:", rightColumn, 48)
  text(data.customerPhone?.trim() || "", rightColumn + 18, 48, 8.5, colors.black)
  label("Dirección:", PAGE.left, 55)
  text(data.address?.trim() || "", PAGE.left + 19, 55, 8.5, colors.black)
  label("Ciudad:", rightColumn, 55)
  text([data.city, data.state].filter(Boolean).join(", "), rightColumn + 15, 55, 8.5, colors.black)
  if (data.customerEmail?.trim()) {
    label("Correo:", PAGE.left, 62)
    text(data.customerEmail.trim(), PAGE.left + 15, 62, 8.5, colors.black)
  }

  label("PRODUCTOS", PAGE.left, 68)
  const showDiscount = data.discount > 0 || data.items.some((item) => Number(item.discount || 0) > 0)
  const headers = ["Producto", "SKU", "Cant.", "Precio unitario", ...(showDiscount ? ["Descuento"] : []), "Subtotal"]
  const body = data.items.map((item) => [
    [item.product_name, item.variant_name].filter(Boolean).join(" / "),
    item.product_sku?.trim() || "-",
    String(item.quantity),
    money(item.unit_price),
    ...(showDiscount ? [Number(item.discount || 0) ? money(Number(item.discount)) : "-"] : []),
    money(item.subtotal),
  ])
  const widths = showDiscount
    ? { 0: 63, 1: 34, 2: 14, 3: 27, 4: 18, 5: 28 }
    : { 0: 70, 1: 39, 2: 15, 3: 31, 4: 29 }
  autoTable(doc, {
    startY: 71,
    margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: 18 },
    head: [headers],
    body,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8, cellPadding: { top: 1.7, right: 1.5, bottom: 1.7, left: 1.5 }, textColor: [17, 17, 17], overflow: "linebreak", lineWidth: 0 },
    headStyles: { fontStyle: "bold", textColor: [17, 17, 17], fillColor: [243, 244, 246], lineColor: [17, 17, 17], lineWidth: { bottom: 0.35 } },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    didParseCell: ({ section, column, cell }) => {
      if (section === "head") {
        if (column.index === 2) cell.styles.halign = "center"
        if (column.index >= 3) cell.styles.halign = "right"
      }
    },
    columnStyles: Object.fromEntries(Object.entries(widths).map(([index, cellWidth]) => [index, {
      cellWidth: Number(cellWidth),
      halign: index === "2" ? "center" : (["3", "4", "5"].includes(index) ? "right" : "left"),
    }])),
    rowPageBreak: "avoid",
    showHead: "everyPage",
  })

  let finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 68
  const lowerBlockHeight = 50
  if (finalY + lowerBlockHeight > PAGE.bottom - 4) {
    doc.addPage()
    finalY = PAGE.top
  }
  const lowerY = finalY + 7
  const summaryX = pageWidth - 80
  const summaryValueX = pageWidth - PAGE.right
  label("PAGO", PAGE.left, lowerY)
  const bankName = data.bankName?.trim() || ""
  const bankAccount = data.bankAccount?.trim() || ""
  const paymentText = bankName && bankAccount
    ? `Transferencia bancaria · Banco: ${bankName} · Cuenta: ${bankAccount}`
    : "Información de pago pendiente de configuración."
  const paymentLines = doc.splitTextToSize(paymentText, 105)
  paymentLines.forEach((value: string, index: number) => text(value, PAGE.left, lowerY + 6 + index * 4.5, 8.2))

  label("ENTREGA", PAGE.left, lowerY + 20)
  const delivery = [
    data.address?.trim() ? `Dirección: ${data.address.trim()}` : "",
    [data.city, data.state].filter(Boolean).length ? `Ciudad: ${[data.city, data.state].filter(Boolean).join(", ")}` : "",
  ].filter(Boolean)
  delivery.forEach((value, index) => text(value, PAGE.left, lowerY + 26 + index * 5, 8.2))

  label("RESUMEN", summaryX, lowerY)
  doc.setDrawColor(colors.light)
  doc.setLineWidth(0.2)
  doc.line(summaryX - 3, lowerY - 4, summaryValueX, lowerY - 4)
  const row = (name: string, value: string, y: number, bold = false) => {
    if (bold) doc.setFont("helvetica", "bold")
    text(name, summaryX, y, bold ? 10 : 8.5, colors.black)
    text(value, summaryValueX, y, bold ? 10 : 8.5, colors.black, { align: "right" })
    if (bold) doc.setFont("helvetica", "normal")
  }
  row("Subtotal", money(data.subtotal), lowerY + 6)
  if (showDiscount) row("Descuento", data.discount ? `-${money(data.discount)}` : "-", lowerY + 11)
  row("Envío", money(data.shipping_cost), lowerY + (showDiscount ? 16 : 11))
  const totalY = lowerY + (showDiscount ? 25 : 20)
  doc.setDrawColor(colors.black)
  doc.setLineWidth(0.3)
  doc.line(summaryX, totalY - 4, summaryValueX, totalY - 4)
  row("TOTAL", money(data.total), totalY + 2, true)

  const noteY = Math.max(lowerY + 39, totalY + 10)
  label("NOTA", PAGE.left, noteY)
  const note = bankName && bankAccount
    ? `Este documento es una proforma y no constituye factura de venta. Consigna el valor a pagar en ${bankName}, cuenta ${bankAccount}.`
    : "Este documento es una proforma y no constituye factura de venta. Datos de consignación pendientes de configuración."
  text(note, PAGE.left, noteY + 6, 8, colors.gray)

  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setDrawColor(colors.light)
    doc.setLineWidth(0.2)
    doc.line(PAGE.left, 280, pageWidth - PAGE.right, 280)
    if (logo) doc.addImage(logo, "PNG", PAGE.left, 282, 7, 7)
    doc.setFont("helvetica", "bold")
    text(storeName, PAGE.left + 10, 286, 7.5, colors.black)
    const contact = [data.storePhone?.trim() ? `Tel. ${data.storePhone.trim()}` : "", data.storeEmail?.trim(), data.storeWebsite?.trim()].filter(Boolean).join(" · ")
    const footerText = contact ? `${contact}  ·  Documento generado automáticamente` : "Documento generado automáticamente"
    doc.setFont("helvetica", "normal")
    text(footerText, PAGE.left + 10 + doc.getTextWidth(storeName) + 4, 286, 7.2, colors.gray)
    text(`Página ${page} de ${pages}`, pageWidth - PAGE.right, 286, 7.2, colors.gray, { align: "right" })
  }
  doc.save(`proforma-${data.orderNumber}.pdf`)
}
