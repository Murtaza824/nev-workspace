import { LoginForm } from './LoginForm'

export const metadata = { title: 'Sign in — New Era Ventures' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; msg?: string }>
}) {
  const { next, error, msg } = await searchParams
  const errorText = error === 'auth_failed' ? (msg ?? 'Authentication failed. Please try again.')
    : error === 'missing_code' ? 'Invalid or expired sign-in link. Please request a new one.'
    : error === 'no_session' ? 'Session could not be established. Please try again.'
    : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-ink-tertiary">
            NEW ERA VENTURES
          </span>
        </div>
        {errorText && (
          <p className="mb-4 font-inter text-xs text-accent-negative text-center" role="alert">
            {errorText}
          </p>
        )}
        <LoginForm next={next} />
      </div>
    </main>
  )
}
