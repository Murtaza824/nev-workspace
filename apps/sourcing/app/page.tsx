export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-12">
      <header className="mb-8 flex items-center justify-between border-b border-[0.5px] border-[var(--color-border)] pb-4">
        <span className="font-mono text-xs font-medium uppercase tracking-widest text-ink-tertiary">
          NEV SIGNAL
        </span>
        <span className="font-mono text-xs text-ink-tertiary">
          SIGNALS / 24H
        </span>
      </header>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="font-mono text-xs text-ink-tertiary">
          No signals yet. The first ingestion run will populate this feed.
        </p>
      </div>
    </main>
  )
}
