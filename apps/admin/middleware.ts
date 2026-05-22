import { createAdminMiddleware } from '@nev/auth'

export const middleware = createAdminMiddleware()

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
