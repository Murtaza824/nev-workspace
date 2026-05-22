export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      {/* Personal position section */}
      <div className="mb-6 h-4 w-32 rounded-pill bg-surface-warm animate-pulse" />
      <div className="flex flex-col gap-6 md:flex-row md:gap-12 mb-4">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-28 rounded bg-surface-warm animate-pulse" />
          <div className="h-8 w-36 rounded bg-surface-warm animate-pulse" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 rounded bg-surface-warm animate-pulse" />
          <div className="h-8 w-36 rounded bg-surface-warm animate-pulse" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-20 rounded bg-surface-warm animate-pulse" />
          <div className="h-8 w-24 rounded bg-surface-warm animate-pulse" />
        </div>
      </div>
      <div className="h-3 w-64 rounded bg-surface-warm animate-pulse mb-10" />

      {/* Fund snapshot section */}
      <div className="mb-6 h-4 w-40 rounded-pill bg-surface-warm animate-pulse" />
      <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-3 mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-3 w-24 rounded bg-surface-warm animate-pulse" />
            <div className="h-7 w-28 rounded bg-surface-warm animate-pulse" />
          </div>
        ))}
      </div>

      {/* Latest update section */}
      <div className="mb-6 h-4 w-36 rounded-pill bg-surface-warm animate-pulse" />
      <div className="rounded-card border border-border-hairline p-6">
        <div className="h-3 w-24 rounded bg-surface-warm animate-pulse mb-3" />
        <div className="h-6 w-3/4 rounded bg-surface-warm animate-pulse mb-3" />
        <div className="h-4 w-full rounded bg-surface-warm animate-pulse mb-2" />
        <div className="h-4 w-2/3 rounded bg-surface-warm animate-pulse mb-5" />
        <div className="h-4 w-28 rounded bg-surface-warm animate-pulse" />
      </div>
    </div>
  )
}
