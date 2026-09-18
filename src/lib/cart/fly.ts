export function flyToCart(from: DOMRect) {
  if (typeof document === "undefined") return

  const targets = Array.from(document.querySelectorAll("[data-cart-target]"))
  const target = targets.find((el) => (el as HTMLElement).offsetParent !== null) as HTMLElement | undefined
  if (!target) return

  const t = target.getBoundingClientRect()
  const size = 26
  const el = document.createElement("div")
  el.style.cssText = [
    "position:fixed",
    `left:${from.left + from.width / 2 - size / 2}px`,
    `top:${from.top + from.height / 2 - size / 2}px`,
    `width:${size}px`,
    `height:${size}px`,
    "border-radius:9999px",
    "background:#C8102E",
    "box-shadow:0 4px 14px rgba(200,16,46,0.45)",
    "z-index:9999",
    "pointer-events:none",
    "opacity:1",
  ].join(";")
  document.body.appendChild(el)

  const dx = t.left + t.width / 2 - (from.left + from.width / 2)
  const dy = t.top + t.height / 2 - (from.top + from.height / 2)

  requestAnimationFrame(() => {
    el.style.transition = "transform 650ms cubic-bezier(0.45,-0.1,0.3,1), opacity 650ms ease-out"
    el.style.transform = `translate(${dx}px, ${dy}px) scale(0.25)`
    el.style.opacity = "0.7"
  })

  window.setTimeout(() => el.remove(), 700)
}

export function notifyCartUpdated(deltaCount = 0, deltaTotal = 0) {
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: { deltaCount, deltaTotal } }))
}
