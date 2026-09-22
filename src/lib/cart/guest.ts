export const GUEST_CART_KEY = "amelatte-guest-cart"

export interface GuestCartItem {
  productId: string
  variantId: string | null
  quantity: number
}

function itemKey(item: Pick<GuestCartItem, "productId" | "variantId">) {
  return `${item.productId}:${item.variantId || "base"}`
}

export function readGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) || "[]")
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is GuestCartItem =>
      typeof item?.productId === "string" &&
      (typeof item.variantId === "string" || item.variantId === null) &&
      Number.isInteger(item.quantity) && item.quantity > 0,
    )
  } catch {
    return []
  }
}

export function writeGuestCart(items: GuestCartItem[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent("cart:updated"))
}

export function addGuestCartItem(productId: string, variantId: string | null, quantity = 1) {
  const items = readGuestCart()
  const existing = items.find((item) => itemKey(item) === itemKey({ productId, variantId }))
  if (existing) existing.quantity += quantity
  else items.push({ productId, variantId, quantity })
  writeGuestCart(items)
}

export function updateGuestCartItem(productId: string, variantId: string | null, quantity: number) {
  const next = readGuestCart()
    .map((item) => itemKey(item) === itemKey({ productId, variantId }) ? { ...item, quantity } : item)
    .filter((item) => item.quantity > 0)
  writeGuestCart(next)
}

export function removeGuestCartItem(productId: string, variantId: string | null) {
  writeGuestCart(readGuestCart().filter((item) => itemKey(item) !== itemKey({ productId, variantId })))
}

export function clearGuestCart() {
  writeGuestCart([])
}
