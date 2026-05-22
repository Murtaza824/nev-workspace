'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type {
  PortfolioCompanyInsert,
  PortfolioCompanyUpdate,
  ValuationEventInsert,
  CoInvestorInsert,
} from '@/lib/types'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createPortfolioCompany(formData: FormData) {
  const adminSupabase = createAdminClient()

  const name = (formData.get('name') as string).trim()
  const slug = (formData.get('slug') as string | null)?.trim() || slugify(name)

  const payload: PortfolioCompanyInsert = {
    slug,
    name,
    stage: (formData.get('stage') as PortfolioCompanyInsert['stage']) || null,
    status: (formData.get('status') as PortfolioCompanyInsert['status']) || 'active',
    one_liner: (formData.get('one_liner') as string | null) || null,
    sector: (formData.get('sector') as string | null) || null,
    website: (formData.get('website') as string | null) || null,
    invested_date: (formData.get('invested_date') as string | null) || null,
    check_size: parseNullableFloat(formData.get('check_size')),
    entry_valuation: parseNullableFloat(formData.get('entry_valuation')),
    ownership_pct: parseNullableFloat(formData.get('ownership_pct')),
    pro_rata_rights: formData.get('pro_rata_rights') === 'true',
    current_valuation: parseNullableFloat(formData.get('current_valuation')),
    current_multiple: parseNullableFloat(formData.get('current_multiple')),
    memo_pdf_url: (formData.get('memo_pdf_url') as string | null) || null,
    thesis: (formData.get('thesis') as string | null) || null,
  }

  const { error } = await adminSupabase.from('portfolio_companies').insert(payload)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/portfolio')
  redirect(`/admin/portfolio/${slug}`)
}

export async function updatePortfolioCompany(id: string, formData: FormData) {
  const adminSupabase = createAdminClient()

  const payload: PortfolioCompanyUpdate = {
    name: (formData.get('name') as string).trim(),
    slug: (formData.get('slug') as string).trim(),
    stage: (formData.get('stage') as PortfolioCompanyUpdate['stage']) || null,
    status: (formData.get('status') as PortfolioCompanyUpdate['status']) || 'active',
    one_liner: (formData.get('one_liner') as string | null) || null,
    sector: (formData.get('sector') as string | null) || null,
    website: (formData.get('website') as string | null) || null,
    invested_date: (formData.get('invested_date') as string | null) || null,
    check_size: parseNullableFloat(formData.get('check_size')),
    entry_valuation: parseNullableFloat(formData.get('entry_valuation')),
    ownership_pct: parseNullableFloat(formData.get('ownership_pct')),
    pro_rata_rights: formData.get('pro_rata_rights') === 'true',
    current_valuation: parseNullableFloat(formData.get('current_valuation')),
    current_multiple: parseNullableFloat(formData.get('current_multiple')),
    memo_pdf_url: (formData.get('memo_pdf_url') as string | null) || null,
    thesis: (formData.get('thesis') as string | null) || null,
  }

  const { error } = await adminSupabase
    .from('portfolio_companies')
    .update(payload)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/portfolio')
  revalidatePath(`/admin/portfolio/${payload.slug}`)
  return { success: true }
}

export async function logValuationEvent(companyId: string, formData: FormData) {
  const adminSupabase = createAdminClient()

  const payload: ValuationEventInsert = {
    company_id: companyId,
    event_date: formData.get('event_date') as string,
    event_type: (formData.get('event_type') as ValuationEventInsert['event_type']) || null,
    new_company_valuation: parseNullableFloat(formData.get('new_company_valuation')),
    new_position_value: parseNullableFloat(formData.get('new_position_value')),
    multiple: parseNullableFloat(formData.get('multiple')),
    note: (formData.get('note') as string | null) || null,
  }

  const { error } = await adminSupabase.from('valuation_events').insert(payload)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/portfolio/${formData.get('slug')}`)
  return { success: true }
}

export async function addCoInvestor(companyId: string, formData: FormData) {
  const adminSupabase = createAdminClient()

  const name = (formData.get('name') as string | null)?.trim()
  if (!name) return { error: 'Name is required.' }

  // Get current max order
  const { data: existing } = await adminSupabase
    .from('co_investors')
    .select('order')
    .eq('company_id', companyId)
    .order('order', { ascending: false })
    .limit(1)

  const maxOrder = existing && existing.length > 0 ? (existing[0] as { order: number }).order : -1

  const payload: CoInvestorInsert = {
    company_id: companyId,
    name,
    order: maxOrder + 1,
  }

  const { error } = await adminSupabase.from('co_investors').insert(payload)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/portfolio/${formData.get('slug')}`)
  return { success: true }
}

export async function removeCoInvestor(coInvestorId: string, slug: string) {
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('co_investors')
    .delete()
    .eq('id', coInvestorId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/portfolio/${slug}`)
  return { success: true }
}

// ── Helpers ─────────────────────────────────────────────────

function parseNullableFloat(v: FormDataEntryValue | null): number | null {
  if (v === null || v === '') return null
  const n = parseFloat(v as string)
  return isNaN(n) ? null : n
}
