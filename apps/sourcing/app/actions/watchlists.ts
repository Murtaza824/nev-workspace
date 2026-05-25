'use server'

import { createServerClient } from '@nev/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { WatchlistFilters } from '@/app/lib/types'

export async function createWatchlist(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return

  const signalTypes = formData.getAll('signal_type') as string[]
  const minScoreStr = formData.get('min_score') as string
  const minScore = minScoreStr ? parseInt(minScoreStr, 10) : undefined

  const filters: WatchlistFilters = {}
  if (signalTypes.length > 0) filters.signal_types = signalTypes
  if (minScore !== undefined && !isNaN(minScore)) filters.min_score = minScore

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('sourcing_watchlists') as any)
    .insert({ name, filters, user_id: user.id })
    .select('id')
    .single()

  revalidatePath('/watchlists')
  if (data?.id) redirect(`/watchlists/${data.id}`)
}

export async function deleteWatchlist(id: string) {
  const supabase = await createServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('sourcing_watchlists') as any).delete().eq('id', id)
  revalidatePath('/watchlists')
  redirect('/watchlists')
}
