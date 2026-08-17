import type { jsPDF } from "jspdf"

export interface ProformaItem {
  product_name: string
  product_sku: string
  variant_name: string | null
  unit_price: number
  quantity: number
  subtotal: number
}

export interface ProformaData {
  orderNumber: string
  createdAt: string
  status?: string | null
  subtotal: number
  shippingCost: number
  discount: number
  total: number
  items: ProformaItem[]
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
  address: string
  city: string
  state: string
  bankName: string
  bankAccount: string
  bankType?: string | null
  bankHolder?: string | null
  bankDocument?: string | null
  paymentMethod?: string | null
  shippingMethod?: string | null
  carrier?: string | null
  trackingNumber?: string | null
  estimatedDelivery?: string | null
  storeName?: string | null
  storePhone?: string | null
  storeEmail?: string | null
  storeAddress?: string | null
  storeWebsite?: string | null
  instagram?: string | null
  facebook?: string | null
  whatsapp?: string | null
  terms?: string | null
}

interface AutoTableDocument extends jsPDF {
  lastAutoTable?: { finalY?: number }
}

const BLACK = [17, 17, 17] as [number, number, number]
const DARK_GRAY = [70, 70, 70] as [number, number, number]
const GRAY = [105, 105, 105] as [number, number, number]
const LINE = [190, 190, 190] as [number, number, number]
const LIGHT_LINE = [225, 225, 225] as [number, number, number]

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  paid: "Pagado",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

function formatCOP(value: number) {
  return `$${Math.round(value).toLocaleString("es-CO")}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function displayValue(value?: string | null) {
  return value?.trim() || "Pendiente de configuración"
}

function statusLabel(value?: string | null) {
  if (!value) return "Pendiente de configuración"
  return STATUS_LABELS[value.toLowerCase()] || value
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function loadImageData(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function text(doc: jsPDF, color: [number, number, number], size: number, style = "normal") {
  doc.setTextColor(...color)
  doc.setFontSize(size)
  doc.setFont("helvetica", style)
}

function heading(doc: jsPDF, title: string, x: number, y: number) {
  text(doc, BLACK, 8.5, "bold")
  doc.text(title.toUpperCase(), x, y)
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.35)
  doc.line(x, y + 2.5, doc.internal.pageSize.getWidth() - 14, y + 2.5)
}

function inlineField(doc: jsPDF, label: string, value: string, x: number, y: number, width: number) {
  text(doc, DARK_GRAY, 8, "bold")
  doc.text(`${label}:`, x, y)
  const labelWidth = doc.getTextWidth(`${label}: `)
  text(doc, BLACK, 8.5)
  doc.text(doc.splitTextToSize(value, Math.max(20, width - labelWidth)), x + labelWidth, y)
}

function footer(doc: jsPDF, data: ProformaData, page: number, pageCount: number, logo: string | null) {
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()
  const y = height - 12
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.35)
  doc.line(14, y - 5, width - 14, y - 5)
  if (logo) doc.addImage(logo, "PNG", 14, y - 1.5, 6, 6)
  text(doc, DARK_GRAY, 7)
  const store = displayValue(data.storeName)
  const contact = [data.storePhone, data.storeEmail, data.storeWebsite].filter(Boolean).join(" · ")
  doc.text(`${store}${contact ? ` · ${contact}` : ""}`, logo ? 23 : 14, y + 2)
  text(doc, GRAY, 6.5)
  doc.text(`Documento generado automáticamente · Gracias por confiar en nosotros.`, logo ? 23 : 14, y + 6)
  doc.text(`Página ${page}/${pageCount}`, width - 14, y + 2, { align: "right" })
}

function continuationHeader(doc: jsPDF, data: ProformaData) {
  const width = doc.internal.pageSize.getWidth()
  text(doc, DARK_GRAY, 8, "bold")
  doc.text(displayValue(data.storeName), 14, 11)
  text(doc, BLACK, 8, "bold")
  doc.text(`PROFORMA · ${data.orderNumber}`, width - 14, 11, { align: "right" })
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.35)
  doc.line(14, 15, width - 14, 15)
}

export async function downloadProformaPdf(data: ProformaData) {
  const { jsPDF } = await import("jspdf")
  const { autoTable } = await import("jspdf-autotable")
  const logo = await loadImageData("/logoWilMotos.png")
  const doc = new jsPDF({ format: "a4", unit: "mm" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - 28

  // Compact horizontal header: no filled banner, only hierarchy and rules.
  if (logo) doc.addImage(logo, "PNG", 14, 11, 11, 11)
  text(doc, BLACK, 14, "bold")
  doc.text(displayValue(data.storeName), logo ? 29 : 14, 16)
  text(doc, GRAY, 7)
  const contact = [data.storePhone, data.storeEmail, data.storeAddress, data.storeWebsite].filter(Boolean).join(" · ")
  if (contact) doc.text(contact, logo ? 29 : 14, 22, { maxWidth: 86 })

  text(doc, BLACK, 21, "bold")
  doc.text("PROFORMA", pageWidth - 14, 16, { align: "right" })
  text(doc, DARK_GRAY, 8.5, "bold")
  doc.text(`Pedido #${data.orderNumber}`, pageWidth - 14, 23, { align: "right" })
  text(doc, GRAY, 7.5)
  doc.text(`${formatDate(data.createdAt)}  ·  Estado: ${statusLabel(data.status)}`, pageWidth - 14, 29, { align: "right" })
  text(doc, GRAY, 6.8)
  doc.text("Documento no constituye factura de venta", pageWidth - 14, 35, { align: "right" })
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.65)
  doc.line(14, 41, pageWidth - 14, 41)

  let y = 50
  heading(doc, "Datos del cliente", 14, y)
  y += 10
  const columnX = 112
  inlineField(doc, "Cliente", data.customerName, 14, y, 92)
  if (data.customerPhone) inlineField(doc, "Teléfono", data.customerPhone, columnX, y, pageWidth - columnX - 14)
  y += 7
  inlineField(doc, "Dirección", data.address, 14, y, 92)
  inlineField(doc, "Ciudad", `${data.city}, ${data.state}`, columnX, y, pageWidth - columnX - 14)
  if (data.customerEmail) {
    y += 7
    inlineField(doc, "Correo", data.customerEmail, 14, y, contentWidth)
  }

  y += 11
  heading(doc, "Productos", 14, y)
  y += 7
  const showDiscount = data.discount > 0
  const productHead = showDiscount
    ? ["Producto", "SKU", "Cant.", "Precio unitario", "Desc.", "Subtotal"]
    : ["Producto", "SKU", "Cant.", "Precio unitario", "Subtotal"]
  const productRows = data.items.map((item) => {
    const base = [
      item.variant_name ? `${item.product_name}\n${item.variant_name}` : item.product_name,
      item.product_sku,
      String(item.quantity),
      formatCOP(item.unit_price),
    ]
    return showDiscount ? [...base, "—", formatCOP(item.subtotal)] : [...base, formatCOP(item.subtotal)]
  })
  const columnStyles: Record<string, { cellWidth: number; fontSize?: number; halign?: "center" | "right" }> = showDiscount
    ? {
        0: { cellWidth: 62 }, 1: { cellWidth: 29, fontSize: 7 }, 2: { cellWidth: 14, halign: "center" as const },
        3: { cellWidth: 32, halign: "right" as const }, 4: { cellWidth: 20, halign: "right" as const }, 5: { cellWidth: 25, halign: "right" as const },
      }
    : {
        0: { cellWidth: 68 }, 1: { cellWidth: 31, fontSize: 7 }, 2: { cellWidth: 14, halign: "center" as const },
        3: { cellWidth: 34, halign: "right" as const }, 4: { cellWidth: 35, halign: "right" as const },
      }

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, top: 22, bottom: 19 },
    head: [productHead],
    body: productRows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: DARK_GRAY,
      cellPadding: { top: 2.3, right: 2, bottom: 2.3, left: 2 },
      lineColor: LIGHT_LINE,
      lineWidth: 0.25,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: BLACK,
      fontSize: 7,
      fontStyle: "bold",
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      lineColor: BLACK,
      lineWidth: { bottom: 0.6, top: 0, left: 0, right: 0 },
    },
    columnStyles,
    rowPageBreak: "avoid",
    showHead: "everyPage",
    willDrawPage: (hook: { pageNumber: number }) => {
      if (hook.pageNumber > 1) continuationHeader(doc, data)
    },
    didParseCell: (hook: { section: string; column: { index: number }; cell: { styles: { fontStyle: string } } }) => {
      if (hook.section === "body" && hook.column.index === 0) hook.cell.styles.fontStyle = "bold"
    },
  })

  const table = doc as unknown as AutoTableDocument
  y = (table.lastAutoTable?.finalY || y) + 7
  const sectionStart = y
  const rightWidth = 68
  const leftWidth = contentWidth - rightWidth - 12
  const rightX = pageWidth - 14 - rightWidth
  const paymentParts = [
    data.bankName && `Banco: ${data.bankName}`,
    data.bankAccount && `Cuenta: ${data.bankAccount}`,
    data.bankType && `Tipo: ${data.bankType}`,
    data.bankHolder && `Titular: ${data.bankHolder}`,
    data.bankDocument && `Documento: ${data.bankDocument}`,
  ].filter(Boolean)
  const paymentText = paymentParts.length
    ? `${(data.paymentMethod || "Transferencia bancaria").toUpperCase()}  ·  ${paymentParts.join("  ·  ")}`
    : "Información de pago pendiente de configuración."
  const deliveryParts = [
    `Dirección: ${data.address}`,
    `${data.city}, ${data.state}`,
    data.shippingMethod && `Método: ${data.shippingMethod}`,
    data.carrier && `Transportadora: ${data.carrier}`,
    data.trackingNumber && `Guía: ${data.trackingNumber}`,
    data.estimatedDelivery && `Entrega estimada: ${data.estimatedDelivery}`,
  ].filter(Boolean)

  heading(doc, "Pago", 14, sectionStart)
  text(doc, DARK_GRAY, 7.8)
  const paymentLines = doc.splitTextToSize(paymentText, leftWidth)
  doc.text(paymentLines, 14, sectionStart + 8)
  heading(doc, "Resumen financiero", rightX, sectionStart)
  const totals = [
    ["Subtotal", formatCOP(data.subtotal)],
    ["Descuento", formatCOP(data.discount)],
    ["Envío", data.shippingCost > 0 ? formatCOP(data.shippingCost) : "Por calcular"],
  ]
  totals.forEach(([label, value], index) => {
    text(doc, DARK_GRAY, 8)
    doc.text(label, rightX, sectionStart + 8 + index * 5)
    doc.text(value, pageWidth - 14, sectionStart + 8 + index * 5, { align: "right" })
  })
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.5)
  doc.line(rightX, sectionStart + 25, pageWidth - 14, sectionStart + 25)
  text(doc, BLACK, 10, "bold")
  doc.text("TOTAL", rightX, sectionStart + 32)
  doc.text(formatCOP(data.total), pageWidth - 14, sectionStart + 32, { align: "right" })

  y = sectionStart + Math.max(39, paymentLines.length * 4.2 + 13)
  if (deliveryParts.length) {
    heading(doc, "Entrega", 14, y)
    text(doc, DARK_GRAY, 7.8)
    doc.text(doc.splitTextToSize(deliveryParts.join("  ·  "), contentWidth), 14, y + 8)
    y += 18
  }

  const paymentNote = data.bankName?.trim() || data.bankAccount?.trim()
    ? `Consigna el valor a pagar en ${displayValue(data.bankName)}, cuenta ${displayValue(data.bankAccount)}.`
    : "Datos de consignación pendientes de configuración."
  const notes = [
    data.terms?.trim() || "Este documento es una proforma y no constituye factura de venta.",
    paymentNote,
  ].join(" ")
  const noteLines = doc.splitTextToSize(notes, contentWidth)
  if (y + noteLines.length * 4.2 + 18 > 280) {
    doc.addPage()
    continuationHeader(doc, data)
    y = 27
  }
  heading(doc, "Nota", 14, y)
  text(doc, GRAY, 7.5)
  doc.text(noteLines, 14, y + 8)

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    footer(doc, data, page, pageCount, logo)
  }

  downloadBlob(doc.output("blob"), `proforma-${data.orderNumber}.pdf`)
}
