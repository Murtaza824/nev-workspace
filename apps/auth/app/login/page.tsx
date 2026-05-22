import { LoginForm } from './LoginForm'

export const metadata = { title: 'Sign in — New Era Ventures' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-ink-tertiary">
            NEW ERA VENTURES
          </span>
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  )
}
