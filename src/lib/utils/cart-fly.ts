export const CART_TARGET_SELECTOR = "[data-cart-target]"

const MIN_THUMB = 56
const MAX_THUMB = 96
const VIEWPORT_MARGIN = 32

export interface FlyOrigin {
  x: number
  y: number
  size: number
}

export interface FlyGeometry {
  token: number
  name: string
  image: string | null
  thumb: number
  from: { x: number; y: number }
  to: { x: number; y: number }
  scale: number
}

const clampToViewport = (value: number, limit: number) =>
  Math.min(Math.max(value, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, limit - VIEWPORT_MARGIN))

// Origen visual: la imagen del producto si esta marcada, si no el elemento que dispara la accion.
export const resolveFlyOrigin = (element: HTMLElement): FlyOrigin | null => {
  if (typeof window === "undefined") return null
  const source = element.closest<HTMLElement>(`[data-fly-origin]`) ?? element
  const rect = source.getBoundingClientRect()
  if (!rect.width || !rect.height) return null

  return {
    x: clampToViewport(rect.left + rect.width / 2, window.innerWidth),
    y: clampToViewport(rect.top + rect.height / 2, window.innerHeight),
    size: Math.min(Math.max(rect.width, rect.height), 240),
  }
}

// Destino: primer icono de carrito realmente visible (desktop, drawer o bottom nav movil).
export const resolveCartTarget = () => {
  if (typeof document === "undefined") return null
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(CART_TARGET_SELECTOR))
  const rects = nodes.map((node) => node.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0)
  if (rects.length === 0) return null

  const viewportHeight = window.innerHeight
  const rect = rects.find((item) => item.bottom > 0 && item.top < viewportHeight) ?? rects[0]
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    size: Math.max(rect.width, rect.height),
  }
}

export const buildFlyGeometry = (
  origin: FlyOrigin | null,
  payload: { token: number; name: string; image: string | null },
): FlyGeometry | null => {
  const target = resolveCartTarget()
  if (!origin || !target) return null

  const thumb = Math.min(MAX_THUMB, Math.max(MIN_THUMB, origin.size))
  return {
    ...payload,
    thumb,
    from: { x: origin.x, y: origin.y },
    to: { x: target.x, y: target.y },
    scale: Math.max(0.28, Math.min(0.75, target.size / thumb)),
  }
}