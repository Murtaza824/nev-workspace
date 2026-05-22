import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminNavDesktop } from '@/components/admin/AdminNavDesktop'
import { AdminNavMobile } from '@/components/admin/AdminNavMobile'
import type { Profile } from '@/lib/types'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = data as Pick<Profile, 'role'> | null

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminNavDesktop />
      <AdminNavMobile />
      <main className="flex-1">{children}</main>
    </div>
  )
}
