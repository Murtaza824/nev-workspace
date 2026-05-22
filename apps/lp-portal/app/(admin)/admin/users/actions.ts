'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteLP(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim()
  const fullName = (formData.get('full_name') as string | null)?.trim()
  const commitmentRaw = formData.get('commitment_amount') as string | null
  const commitmentAmount = commitmentRaw ? parseFloat(commitmentRaw) : null

  if (!email) {
    return { error: 'Email is required.' }
  }

  const adminSupabase = createAdminClient()

  // Invite the user — do NOT pass role in metadata (trigger always assigns 'lp')
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://lp.neweraventures.com')
  const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
    email,
    {
      data: fullName ? { full_name: fullName } : {},
      redirectTo: `${siteUrl}/auth/callback`,
    }
  )

  if (inviteError) {
    return { error: inviteError.message }
  }

  const userId = inviteData.user?.id
  if (!userId) {
    return { error: 'Invite succeeded but no user ID returned.' }
  }

  // Update profile with commitment amount if provided
  if (commitmentAmount !== null && !isNaN(commitmentAmount)) {
    await adminSupabase
      .from('profiles')
      .update({ commitment_amount: commitmentAmount })
      .eq('id', userId)
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function createOrAssignEntity(formData: FormData) {
  const userId = formData.get('user_id') as string | null
  const action = formData.get('action') as 'create' | 'assign' | null

  if (!userId || !action) return { error: 'Missing required fields.' }

  const adminSupabase = createAdminClient()

  if (action === 'create') {
    const entityName = (formData.get('entity_name') as string | null)?.trim()
    if (!entityName) return { error: 'Entity name is required.' }

    // Carry the LP's commitment over to the entity
    const { data: profileData } = await adminSupabase
      .from('profiles')
      .select('commitment_amount')
      .eq('id', userId)
      .single()
    const commitmentAmount =
      (profileData as { commitment_amount: number | null } | null)?.commitment_amount ?? null

    const { data: newEntity, error: createError } = await adminSupabase
      .from('lp_entities')
      .insert({ name: entityName, commitment_amount: commitmentAmount })
      .select()
      .single()

    if (createError || !newEntity) {
      return { error: createError?.message ?? 'Failed to create entity.' }
    }

    await adminSupabase.from('profiles').update({ entity_id: newEntity.id }).eq('id', userId)
  } else {
    const entityId = formData.get('entity_id') as string | null
    if (!entityId) return { error: 'Entity ID is required.' }
    await adminSupabase.from('profiles').update({ entity_id: entityId }).eq('id', userId)
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteLP(formData: FormData) {
  const userId = formData.get('user_id') as string | null
  if (!userId) return { error: 'User ID is required.' }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function resendInvite(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim()
  if (!email) return { error: 'Email is required.' }

  const adminSupabase = createAdminClient()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://lp.neweraventures.com')

  const { error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback`,
  })
  if (error) return { error: error.message }

  return { success: true }
}

export async function updateCommitment(formData: FormData) {
  const userId = formData.get('user_id') as string | null
  const commitmentRaw = formData.get('commitment_amount') as string | null

  if (!userId || !commitmentRaw) {
    return { error: 'User ID and commitment amount are required.' }
  }

  const commitmentAmount = parseFloat(commitmentRaw)
  if (isNaN(commitmentAmount)) {
    return { error: 'Invalid commitment amount.' }
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('profiles')
    .update({ commitment_amount: commitmentAmount })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/users')
  return { success: true }
}
