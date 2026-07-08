import { ProductGridSkeleton } from "@/components/store/ProductCardSkeleton"

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 lg:py-8 lg:px-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-9 w-full animate-pulse rounded-full bg-gray-100 lg:hidden" />
        <div className="h-9 w-20 animate-pulse rounded-full bg-gray-100 lg:hidden" />
      </div>
      <div className="mb-4 h-5 w-32 animate-pulse rounded bg-gray-100 hidden lg:block" />
      <ProductGridSkeleton count={6} />
    </div>
  )
}
