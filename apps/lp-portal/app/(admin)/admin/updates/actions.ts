'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { UpdateInsert, UpdateUpdate } from '@/lib/types'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function deriveExcerpt(bodyMd: string | null, overrideExcerpt: string | null): string | null {
  if (overrideExcerpt?.trim()) return overrideExcerpt.trim()
  if (!bodyMd) return null
  return bodyMd.replace(/[#*_`[\]]/g, '').slice(0, 200) || null
}

export async function createUpdate(formData: FormData, publish: boolean) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  const title = (formData.get('title') as string).trim()
  const slug = (formData.get('slug') as string | null)?.trim() || slugify(title)
  const bodyMd = (formData.get('body_md') as string | null) || null
  const overrideExcerpt = formData.get('excerpt') as string | null

  const payload: UpdateInsert = {
    slug,
    title,
    subtitle: (formData.get('subtitle') as string | null) || null,
    body_md: bodyMd,
    excerpt: deriveExcerpt(bodyMd, overrideExcerpt),
    author_id: user?.id ?? null,
    related_company_id: (formData.get('related_company_id') as string | null) || null,
    pdf_url: (formData.get('pdf_url') as string | null) || null,
    status: publish ? 'published' : 'draft',
    published_at: publish ? new Date().toISOString() : null,
  }

  const { error } = await adminSupabase.from('updates').insert(payload)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/updates')
  revalidatePath('/updates')
  redirect(`/admin/updates/${slug}`)
}

export async function saveUpdate(id: string, formData: FormData, publish: boolean) {
  const adminSupabase = createAdminClient()

  const bodyMd = (formData.get('body_md') as string | null) || null
  const overrideExcerpt = formData.get('excerpt') as string | null

  // Get current status to check if we're publishing for the first time
  const { data: current } = await adminSupabase
    .from('updates')
    .select('status, published_at, slug')
    .eq('id', id)
    .single()

  const isFirstPublish = publish && current?.status === 'draft'

  const payload: UpdateUpdate = {
    slug: (formData.get('slug') as string).trim(),
    title: (formData.get('title') as string).trim(),
    subtitle: (formData.get('subtitle') as string | null) || null,
    body_md: bodyMd,
    excerpt: deriveExcerpt(bodyMd, overrideExcerpt),
    related_company_id: (formData.get('related_company_id') as string | null) || null,
    pdf_url: (formData.get('pdf_url') as string | null) || null,
    status: publish ? 'published' : 'draft',
    published_at: publish
      ? isFirstPublish
        ? new Date().toISOString()
        : current?.published_at ?? new Date().toISOString()
      : null,
  }

  const { error } = await adminSupabase.from('updates').update(payload).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/updates')
  revalidatePath(`/admin/updates/${payload.slug}`)
  revalidatePath('/updates')
  if (current?.slug && current.slug !== payload.slug) {
    revalidatePath(`/updates/${current.slug}`)
  }
  revalidatePath(`/updates/${payload.slug}`)
  return { success: true }
}
