export default function UpdatesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      {/* Page header */}
      <div className="h-8 w-32 rounded bg-surface-warm animate-pulse mb-3" />
      <div className="h-4 w-64 rounded bg-surface-warm animate-pulse mb-10" />

      {/* Update list skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-b border-border-hairline py-8">
          <div className="h-3 w-24 rounded bg-surface-warm animate-pulse mb-3" />
          <div className="h-6 w-3/4 rounded bg-surface-warm animate-pulse mb-2" />
          <div className="h-4 w-full rounded bg-surface-warm animate-pulse mb-1" />
          <div className="h-4 w-2/3 rounded bg-surface-warm animate-pulse mb-4" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-surface-warm animate-pulse shrink-0" />
            <div className="h-3 w-24 rounded bg-surface-warm animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
