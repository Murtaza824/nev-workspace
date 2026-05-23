'use server'

import { createServerClient } from '@nev/db'
import { revalidatePath } from 'next/cache'

type ActiveStatus = 'pursuing' | 'passed' | 'snoozed' | 'reviewed'

export async function updateSignalStatus(signalId: string, status: ActiveStatus) {
  const supabase = await createServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signals = supabase.from('sourcing_signals') as any
  if (status === 'snoozed') {
    const { error } = await signals
      .update({ status: 'snoozed', snoozed_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
      .eq('id', signalId)
    if (error) throw new Error((error as Error).message)
  } else {
    const { error } = await signals.update({ status }).eq('id', signalId)
    if (error) throw new Error((error as Error).message)
  }
  revalidatePath(`/signal/${signalId}`)
  revalidatePath('/')
}

export async function addNote(signalId: string, body: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notes = supabase.from('sourcing_signal_notes') as any
  const { error } = await notes.insert({ signal_id: signalId, author_id: user.id, body: body.trim() })
  if (error) throw new Error(error.message)
  revalidatePath(`/signal/${signalId}`)
}
