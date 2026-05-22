/**
 * Domain type aliases for the NEV LP Portal.
 * These are re-exported from database.types.ts — the single source of truth.
 * Use these aliases throughout the application instead of raw Database["public"]["Tables"]["..."]["Row"].
 */

import type { Database } from './database.types'

export type LpEntity = Database['public']['Tables']['lp_entities']['Row']
export type LpEntityInsert = Database['public']['Tables']['lp_entities']['Insert']
export type LpEntityUpdate = Database['public']['Tables']['lp_entities']['Update']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Fund = Database['public']['Tables']['fund']['Row']
export type PortfolioCompany = Database['public']['Tables']['portfolio_companies']['Row']
export type ValuationEvent = Database['public']['Tables']['valuation_events']['Row']
export type CoInvestor = Database['public']['Tables']['co_investors']['Row']
export type Update = Database['public']['Tables']['updates']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type FundInsert = Database['public']['Tables']['fund']['Insert']
export type FundUpdate = Database['public']['Tables']['fund']['Update']
export type PortfolioCompanyInsert = Database['public']['Tables']['portfolio_companies']['Insert']
export type PortfolioCompanyUpdate = Database['public']['Tables']['portfolio_companies']['Update']
export type ValuationEventInsert = Database['public']['Tables']['valuation_events']['Insert']
export type ValuationEventUpdate = Database['public']['Tables']['valuation_events']['Update']
export type CoInvestorInsert = Database['public']['Tables']['co_investors']['Insert']
export type CoInvestorUpdate = Database['public']['Tables']['co_investors']['Update']
export type UpdateInsert = Database['public']['Tables']['updates']['Insert']
export type UpdateUpdate = Database['public']['Tables']['updates']['Update']
