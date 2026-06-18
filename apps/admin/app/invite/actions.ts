'use server'

import { createServerClient, createAdminClient } from '@nev/db'
import { redirect } from 'next/navigation'

export async function inviteUser(formData: FormData) {
  const email = (formData.get('email') as string).trim().toLowerCase()
  const role = formData.get('role') as 'admin' | 'member' | 'lp' | 'intern'
  const appAccess = formData.getAll('app_access') as string[]

  if (!email || !role || appAccess.length === 0) {
    throw new Error('Email, role, and at least one tool are required.')
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthenticated')

  const token = crypto.randomUUID()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await supabase.from('invitations').insert({
    email,
    role,
    app_access: appAccess,
    invited_by: user.id,
    token,
  } as any)

  if (insertError) throw new Error(`Failed to create invitation: ${insertError.message}`)

  const adminClient = createAdminClient()
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { invitation_token: token },
    redirectTo: `${process.env.NEV_AUTH_URL ?? 'https://auth.neweraventures.com'}/callback`,
  })

  if (inviteError) {
    // Supabase returns 422 when the email is already registered.
    // Fall back to a magic link — the invitation row is already in place so
    // accept_invitation() will fire on callback and apply the role/app_access.
    const alreadyExists =
      inviteError.status === 422 ||
      inviteError.message.toLowerCase().includes('already')

    if (!alreadyExists) {
      await supabase.from('invitations').delete().eq('token', token)
      throw new Error(`Failed to send invitation: ${inviteError.message}`)
    }

    const { error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEV_AUTH_URL ?? 'https://auth.neweraventures.com'}/callback`,
      },
    })

    if (linkError) {
      await supabase.from('invitations').delete().eq('token', token)
      throw new Error(`Failed to send access link: ${linkError.message}`)
    }
  } else if (inviteData?.user?.id) {
    // Immediately reflect the pending invitation in the profile so the admin
    // list shows the correct role/access and INVITED status before acceptance.
    await adminClient
      .from('profiles')
      .update({ status: 'invited', role, app_access: appAccess })
      .eq('id', inviteData.user.id)
  }

  redirect('/')
}
