'use server'

import { createAdminClient } from '@nev/db'
import { revalidatePath } from 'next/cache'

export async function deactivateUser(userId: string) {
  if (!userId) throw new Error('userId required')

  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ status: 'deactivated' })
    .eq('id', userId)

  if (error) throw new Error(`Failed to deactivate user: ${error.message}`)

  revalidatePath('/')
}
