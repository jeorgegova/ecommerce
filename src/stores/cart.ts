"use client"

import { buildFlyGeometry, type FlyOrigin, type FlyGeometry } from "@/lib/utils/cart-fly"
import { createClient } from "@/lib/supabase/client"
import { create } from "zustand"

export interface CartLine {
  product_id: string
  variant_id: string | null
  quantity: number
}

export interface CartProduct {
  id: string
  name: string
  slug: string
  sku: string
  base_price: number
  sale_price: number | null
  promotion_active: boolean
  stock: number
  has_variants: boolean
  product_images: { url: string; is_main: boolean }[]
}

export interface CartVariant {
  id: string
  name: string
  sku: string
  price_adjustment: number
  stock: number
}

export interface CartItemRow extends CartLine {
  id: string
  created_at: string
  products: CartProduct | null
  product_variants: CartVariant | null
}

export type { FlyGeometry, FlyOrigin }

export interface CartLineRef {
  product_id: string
  variant_id: string | null
}

export interface AddToCartInput extends CartLineRef {
  quantity?: number
  name?: string
  image?: string | null
  origin?: FlyOrigin | null
}

export type CartMutationResult = "ok" | "unauthenticated" | "failed"

interface CartState {
  lines: Record<string, CartLine>
  items: CartItemRow[]
  itemsLoaded: boolean
  userId: string | null
  ready: boolean
  error: string
  pulse: number
  flights: FlyGeometry[]

  initCart: () => Promise<void>
  ensureReady: () => Promise<void>
  bootstrap: (userId: string | null) => Promise<void>
  syncLines: () => Promise<void>
  loadItems: () => Promise<void>
  addItem: (input: AddToCartInput) => Promise<CartMutationResult>
  setQuantity: (line: CartLineRef, quantity: number) => Promise<boolean>
  removeItem: (line: CartLineRef) => Promise<boolean>
  resetLocal: () => void
  bumpPulse: () => void
  landFlight: (token: number) => void
}

export const cartLineKey = (productId: string, variantId?: string | null) =>
  `${productId}::${variantId ?? "base"}`

const linesFromRows = (rows: CartLine[]): Record<string, CartLine> => {
  const next: Record<string, CartLine> = {}
  for (const row of rows) next[cartLineKey(row.product_id, row.variant_id)] = { ...row }
  return next
}

// Las escrituras se serializan: dos clics rápidos nunca leen un estado viejo
// ni chocan con los indices unicos parciales de cart_items.
let writeQueue: Promise<unknown> = Promise.resolve()
let pendingWrites = 0

const enqueueWrite = <T>(task: () => Promise<T>): Promise<T> => {
  pendingWrites += 1
  const result = writeQueue.then(task, task)
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  )
  return result.finally(() => {
    pendingWrites -= 1
  })
}

const waitForWrites = () => (pendingWrites > 0 ? writeQueue.then(() => undefined) : Promise.resolve())

type LineSelect = {
  id: string
  quantity: number
}

const findLineRow = async (
  supabase: ReturnType<typeof createClient>,
  userId: string,
  productId: string,
  variantId: string | null,
) => {
  let query = supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
  query = variantId ? query.eq("variant_id", variantId) : query.is("variant_id", null)
  const { data, error } = await query.maybeSingle()
  return { row: (data ?? null) as LineSelect | null, error: error?.message ?? null }
}

const persistIncrement = async (
  supabase: ReturnType<typeof createClient>,
  userId: string,
  productId: string,
  variantId: string | null,
  delta: number,
): Promise<string | null> => {
  const { row, error } = await findLineRow(supabase, userId, productId, variantId)
  if (error) return error

  if (row) {
    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: Number(row.quantity) + delta })
      .eq("id", row.id)
    return updateError?.message ?? null
  }

  const { error: insertError } = await supabase
    .from("cart_items")
    .insert({ user_id: userId, product_id: productId, variant_id: variantId, quantity: delta })
  return insertError?.message ?? null
}

const persistQuantity = async (
  supabase: ReturnType<typeof createClient>,
  userId: string,
  productId: string,
  variantId: string | null,
  target: number,
): Promise<string | null> => {
  const { row, error } = await findLineRow(supabase, userId, productId, variantId)
  if (error) return error

  if (target < 1) {
    if (!row) return null
    const { error: deleteError } = await supabase.from("cart_items").delete().eq("id", row.id)
    return deleteError?.message ?? null
  }

  if (row) {
    const { error: updateError } = await supabase.from("cart_items").update({ quantity: target }).eq("id", row.id)
    return updateError?.message ?? null
  }

  const { error: insertError } = await supabase
    .from("cart_items")
    .insert({ user_id: userId, product_id: productId, variant_id: variantId, quantity: target })
  return insertError?.message ?? null
}

const MAX_FLIGHTS = 3
const FLIGHT_LIFETIME = 1600
const flightTimers = new Set<ReturnType<typeof setTimeout>>()

let flyToken = 0

// Red de seguridad: si la animacion nunca reporta fin, el nodo se elimina solo.
const scheduleFlightCleanup = (token: number) => {
  const timer = setTimeout(() => {
    flightTimers.delete(timer)
    useCartStore.getState().landFlight(token)
  }, FLIGHT_LIFETIME)
  flightTimers.add(timer)
}

let initPromise: Promise<void> | null = null

const startInit = () => {
  if (!initPromise) {
    initPromise = (async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      await useCartStore.getState().bootstrap(data.user?.id ?? null)

      supabase.auth.onAuthStateChange((_event, session) => {
        void useCartStore.getState().bootstrap(session?.user?.id ?? null)
      })

      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible" && useCartStore.getState().userId) {
            void useCartStore.getState().syncLines()
          }
        })
      }

      if (typeof window !== "undefined") {
        window.addEventListener("focus", () => {
          if (useCartStore.getState().userId) void useCartStore.getState().syncLines()
        })
      }

      // Sin sesion no habra nada que sincronizar: el carrito esta vacio.
      if (!useCartStore.getState().ready) useCartStore.setState({ ready: true })
    })().catch((error: unknown) => {
      initPromise = null
      throw error
    })
  }
  return initPromise
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: {},
  items: [],
  itemsLoaded: false,
  userId: null,
  ready: false,
  error: "",
  pulse: 0,
  flights: [],

  initCart: async () => {
    await startInit()
  },

  ensureReady: async () => {
    if (get().ready) return
    await startInit()
    // startInit ya corrio antes (por ejemplo tras un resetLocal al vaciar el
    // carrito en el checkout): el estado se conoce, solo falta marcarlo.
    if (!get().ready) set({ ready: true })
  },

  bootstrap: async (userId) => {
    if (get().userId === userId) return
    set({ userId, lines: {}, items: [], itemsLoaded: false, ready: false, error: "" })
    if (!userId) return
    await get().syncLines()
  },

  syncLines: async () => {
    const { userId } = get()
    if (!userId) return
    await waitForWrites()

    const supabase = createClient()
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, product_id, variant_id, quantity")
      .eq("user_id", userId)

    if (error) return
    const rows = (data ?? []) as CartLine[]
    set({ lines: linesFromRows(rows), ready: true })
  },

  loadItems: async () => {
    await get().ensureReady()
    const { userId } = get()
    if (!userId) {
      set({ items: [], itemsLoaded: true })
      return
    }
    await waitForWrites()

    const supabase = createClient()
    const { data, error } = await supabase
      .from("cart_items")
      .select("*, products(*, product_images(url, is_main)), product_variants(*)")
      .eq("user_id", userId)
      .order("created_at")

    if (error) {
      set({ items: [], itemsLoaded: true })
      return
    }

    const rows = (data ?? []) as CartItemRow[]
    // Las cantidades optimistas ganan sobre el servidor para no pisar un clic
    // que todavia no se ha escrito.
    const merged = { ...linesFromRows(rows), ...get().lines }
    const items = rows
      .filter((row) => merged[cartLineKey(row.product_id, row.variant_id)])
      .map((row) => ({ ...row, quantity: merged[cartLineKey(row.product_id, row.variant_id)].quantity }))

    set({ lines: merged, items, itemsLoaded: true, ready: true })
  },

  addItem: async (input) => {
    // Sin hidratar, la cantidad optimista seria incorrecta y la escritura
    // relativa podria partir de una base equivocada. El guardia es sincrono
    // a proposito: en el caso comum no se interpone ningun await entre el
    // clic y el set optimista.
    if (!get().ready) await get().ensureReady()
    const { userId } = get()
    if (!userId) return "unauthenticated"

    const delta = Math.max(1, Math.floor(input.quantity ?? 1))
    const key = cartLineKey(input.product_id, input.variant_id)
    const flight = buildFlyGeometry(input.origin ?? null, {
      token: ++flyToken,
      name: input.name ?? "",
      image: input.image ?? null,
    })

    // 1. optimista
    set((state) => {
      const current = state.lines[key]
      const nextLines: Record<string, CartLine> = {
        ...state.lines,
        [key]: {
          product_id: input.product_id,
          variant_id: input.variant_id,
          quantity: (current?.quantity ?? 0) + delta,
        },
      }
      return {
        lines: nextLines,
        items: state.items.map((item) =>
          cartLineKey(item.product_id, item.variant_id) === key
            ? { ...item, quantity: nextLines[key].quantity }
            : item,
        ),
        error: "",
        flights: flight ? [...state.flights, flight].slice(-MAX_FLIGHTS) : state.flights,
        pulse: flight ? state.pulse : state.pulse + 1,
      }
    })

    if (flight) scheduleFlightCleanup(flight.token)

    // 2. persistencia
    const message = await enqueueWrite(() => {
      const supabase = createClient()
      return persistIncrement(supabase, userId, input.product_id, input.variant_id, delta)
    })

    // 3. reconciliacion o rollback
    if (message) {
      set({ error: message, flights: [] })
      await get().syncLines()
      if (get().itemsLoaded) await get().loadItems()
      return "failed"
    }

    await get().syncLines()
    return "ok"
  },

  setQuantity: async (line, quantity) => {
    if (!get().ready) await get().ensureReady()
    const { userId } = get()
    if (!userId) return false

    const key = cartLineKey(line.product_id, line.variant_id)
    const target = Math.max(0, Math.floor(quantity))

    set((state) => {
      const nextLines = { ...state.lines }
      if (target < 1) delete nextLines[key]
      else nextLines[key] = { product_id: line.product_id, variant_id: line.variant_id, quantity: target }
      return {
        lines: nextLines,
        items: target < 1
          ? state.items.filter((item) => cartLineKey(item.product_id, item.variant_id) !== key)
          : state.items.map((item) =>
              cartLineKey(item.product_id, item.variant_id) === key ? { ...item, quantity: target } : item,
            ),
        pulse: state.pulse + 1,
        error: "",
      }
    })

    const message = await enqueueWrite(() => {
      const supabase = createClient()
      return persistQuantity(supabase, userId, line.product_id, line.variant_id, target)
    })

    if (message) {
      set({ error: message })
      await get().syncLines()
      if (get().itemsLoaded) await get().loadItems()
      return false
    }

    await get().syncLines()
    return true
  },

  removeItem: async (line) => get().setQuantity(line, 0),

  resetLocal: () => {
    set((state) => ({ lines: {}, items: [], itemsLoaded: false, ready: false, error: "", pulse: state.pulse + 1 }))
  },

  bumpPulse: () => set((state) => ({ pulse: state.pulse + 1 })),

  landFlight: (token) => {
    set((state) => ({ flights: state.flights.filter((item) => item.token !== token), pulse: state.pulse + 1 }))
  },

}))