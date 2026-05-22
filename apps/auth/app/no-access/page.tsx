export const metadata = { title: 'Access denied — New Era Ventures' }

export default function NoAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12">
      <div className="w-full max-w-sm text-center">
        <span className="font-mono text-xs font-medium uppercase tracking-widest text-ink-tertiary">
          NEW ERA VENTURES
        </span>
        <h1 className="mt-8 font-inter text-base font-medium text-ink-primary">
          Access denied
        </h1>
        <p className="mt-3 font-inter text-sm leading-relaxed text-ink-secondary">
          Your account doesn't have access to this tool. Contact{' '}
          <a
            href="mailto:ir@neweraventures.com"
            className="text-ink-primary underline underline-offset-2"
          >
            ir@neweraventures.com
          </a>{' '}
          to request access.
        </p>
      </div>
    </main>
  )
}
