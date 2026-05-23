import { createAccessMiddleware } from '@nev/auth'

export const middleware = createAccessMiddleware('sourcing')

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
