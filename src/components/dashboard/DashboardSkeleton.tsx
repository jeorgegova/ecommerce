export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gray-200" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-3.5 w-52 rounded bg-gray-200" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
              <div className="h-5 w-14 rounded-full bg-gray-200" />
            </div>
            <div className="mt-4 h-7 w-28 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-20 rounded bg-gray-200" />
            <div className="mt-3 h-8 w-full rounded bg-gray-100" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-14 rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
        <div className="h-[280px] rounded-lg bg-gray-100" />
      </div>
    </div>
  )
}
