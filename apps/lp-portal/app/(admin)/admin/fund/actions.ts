'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FundUpdate } from '@/lib/types'

export async function updateFund(id: string, formData: FormData) {
  const adminSupabase = createAdminClient()

  const payload: FundUpdate = {
    name: (formData.get('name') as string | null) || 'NEV Fund I',
    vintage: parseNullableInt(formData.get('vintage')),
    total_committed: parseNullableFloat(formData.get('total_committed')),
    total_called: parseNullableFloat(formData.get('total_called')),
    total_deployed: parseNullableFloat(formData.get('total_deployed')),
    total_current_value: parseNullableFloat(formData.get('total_current_value')),
    as_of_date: (formData.get('as_of_date') as string | null) || null,
    last_updated: new Date().toISOString(),
  }

  const { error } = await adminSupabase.from('fund').update(payload).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/fund')
  revalidatePath('/dashboard')
  return { success: true }
}

function parseNullableFloat(v: FormDataEntryValue | null): number | null {
  if (v === null || v === '') return null
  const n = parseFloat(v as string)
  return isNaN(n) ? null : n
}

function parseNullableInt(v: FormDataEntryValue | null): number | null {
  if (v === null || v === '') return null
  const n = parseInt(v as string, 10)
  return isNaN(n) ? null : n
}
