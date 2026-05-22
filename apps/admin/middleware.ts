import { createAdminMiddleware, standardMatcher } from '@nev/auth'

export const middleware = createAdminMiddleware()
export const config = standardMatcher
