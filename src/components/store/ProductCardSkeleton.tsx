export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="aspect-[4/3] w-full shimmer-bg" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-3 w-1/4 rounded-full shimmer-bg" />
        <div className="h-4 w-full rounded-lg shimmer-bg" />
        <div className="h-4 w-3/4 rounded-lg shimmer-bg" />
        <div className="flex items-end justify-between pt-1">
          <div className="h-5 w-1/3 rounded-lg shimmer-bg" />
          <div className="h-4 w-10 rounded-lg shimmer-bg" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
