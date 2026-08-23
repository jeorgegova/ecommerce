export interface Candidate {
  id: string
  name: string
  price: number // integer COP
  stock: number
  image?: string | null
}

export interface PickedItem {
  product: Candidate
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface RandomPurchaseResult {
  items: PickedItem[]
  subtotal: number
  discount: number
  total: number
  exact: boolean
  overage: number
}

// límite performance
const MAX_CANDIDATES = 150
const MAX_QTY_PER_PRODUCT = 6
const MAX_DP_SIZE = 300000 // cap array size
const TIME_BUDGET_MS = 600

function prepareCandidates(products: Candidate[], target: number): Candidate[] {
  // solo productos con price >0 && price <= target + maxPrice? incluir todos pero limitar
  const sorted = [...products].sort((a,b)=> a.price - b.price)
  // si muchos productos, tomar los más baratos primero, pero también samplear caros para diversidad
  if (sorted.length <= MAX_CANDIDATES) return sorted
  // tomar 120 cheapest + 30 random de resto para diversificar
  const cheap = sorted.slice(0, 120)
  const rest = sorted.slice(120)
  // sample 30 random
  for (let i = rest.length -1; i>0; i--) {
    const j = Math.floor(Math.random() * (i+1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return [...cheap, ...rest.slice(0,30)].sort((a,b)=>a.price-b.price)
}

function binarySplitCandidates(cands: Candidate[], target: number) {
  type SplitItem = { candIdx:number, qty:number, price:number, count:number }
  const splits: SplitItem[] = []
  let maxPrice = 0
  cands.forEach((c, idx)=>{
    maxPrice = Math.max(maxPrice, c.price)
    const maxQty = Math.min(c.stock, MAX_QTY_PER_PRODUCT, Math.ceil(target / Math.max(1,c.price)) + 1)
    let remaining = maxQty
    let k=1
    while(remaining>0){
      const take = Math.min(k, remaining)
      splits.push({candIdx: idx, qty: take, price: take*c.price, count: take})
      remaining -= take
      k <<=1
    }
  })
  return {splits, maxPrice}
}

export function findBestCombination(products: Candidate[], target: number): RandomPurchaseResult | null {
  if (!products.length) return null
  if (target <=0) return null
  const start = Date.now()
  const cands = prepareCandidates(products.filter(p=> p.price>0 && p.stock>0), target)
  if (!cands.length) return null

  const {splits, maxPrice} = binarySplitCandidates(cands, target)
  const limit = Math.min(target + maxPrice, target + 50000, MAX_DP_SIZE)
  // if limit too large, fallback to greedy
  if (limit > MAX_DP_SIZE) {
    return greedyFallback(cands, target)
  }
  const INF = 1e9
  const dpCount = new Array(limit+1).fill(INF)
  const parent: Array<{prev:number, splitIdx:number} | null> = new Array(limit+1).fill(null)
  dpCount[0]=0

  for (let sIdx=0; sIdx<splits.length; sIdx++){
    if (Date.now() - start > TIME_BUDGET_MS) break
    const it = splits[sIdx]
    for (let sum=limit - it.price; sum>=0; sum--){
      if (dpCount[sum]===INF) continue
      const ns = sum + it.price
      const nCount = dpCount[sum] + it.count
      if (nCount < dpCount[ns]) {
        dpCount[ns]=nCount
        parent[ns]={prev: sum, splitIdx: sIdx}
      }
    }
  }

  // search best
  let bestSum: number | null = null
  let bestOver = Infinity
  let bestCount = Infinity

  // exact first
  if (target <= limit && dpCount[target] !== INF) {
    bestSum = target
  } else {
    for (let s=target+1; s<=limit; s++){
      if (dpCount[s]===INF) continue
      const over = s - target
      const cnt = dpCount[s]
      if (over < bestOver || (over===bestOver && cnt < bestCount)) {
        bestOver = over
        bestCount = cnt
        bestSum = s
      }
      // early break if over already minimal and count minimal? keep scanning for same over smaller cnt
      if (over > bestOver) break // since over increasing, no better over
      if (Date.now() - start > TIME_BUDGET_MS) break
    }
  }

  if (bestSum===null) {
    // no >= target reachable, try closest below? but spec requires >= for discount, so return null
    // fallback: find max reachable < target
    let maxReach = -1
    for (let s=target-1; s>=0; s--) if (dpCount[s]!==INF){ maxReach=s; break}
    if (maxReach===-1) return null
    // if maxReach exists but < target, we cannot reach target with discount, return null to show "no combinacion"
    return null
  }

  // reconstruct
  const qtyMap = new Map<number, number>() // candIdx -> qty
  let cur = bestSum!
  while(cur>0){
    const p = parent[cur]
    if (!p) break // should not happen
    const sp = splits[p.splitIdx]
    qtyMap.set(sp.candIdx, (qtyMap.get(sp.candIdx)||0) + sp.qty)
    cur = p.prev
  }

  const items: PickedItem[] = []
  let subtotal = 0
  qtyMap.forEach((qty, candIdx)=>{
    const prod = cands[candIdx]
    const sub = qty * prod.price
    subtotal += sub
    items.push({product: prod, quantity: qty, unitPrice: prod.price, subtotal: sub})
  })
  // sort by price desc for display
  items.sort((a,b)=> b.unitPrice - a.unitPrice)

  const discount = subtotal - target
  const exact = discount===0
  return {items, subtotal, discount: Math.max(0,discount), total: target, exact, overage: discount}
}

function greedyFallback(cands: Candidate[], target:number): RandomPurchaseResult | null {
  // simple greedy: fill with cheapest until near target, then adjust
  const items: PickedItem[] = []
  let remaining = target
  const sorted = [...cands].sort((a,b)=>a.price-b.price)
  for (const c of sorted){
    if (remaining<=0) break
    const qty = Math.min(c.stock, Math.ceil(remaining / c.price), MAX_QTY_PER_PRODUCT)
    if (qty<=0) continue
    // try to fit without overshoot too much
    let useQty = Math.min(qty, Math.floor(remaining / c.price))
    if (useQty===0 && remaining>0) useQty=1 // allow over
    const sub = useQty * c.price
    items.push({product:c, quantity:useQty, unitPrice:c.price, subtotal:sub})
    remaining -= sub
    if (remaining <0) remaining=0 // over
  }
  const subtotal = items.reduce((s,i)=>s+i.subtotal,0)
  if (subtotal < target) return null
  // try to optimize last item to reduce overage
  return {items, subtotal, discount: subtotal-target, total: target, exact: subtotal===target, overage: subtotal-target}
}
