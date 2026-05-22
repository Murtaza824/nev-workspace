import { createAccessMiddleware, standardMatcher } from '@nev/auth'

export const middleware = createAccessMiddleware('sourcing')
export const config = standardMatcher
