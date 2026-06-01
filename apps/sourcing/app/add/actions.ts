'use server'

const ENRICH_URL = 'https://api.crustdata.com/person/enrich'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRUSTDATA_KEY = process.env.CRUSTDATA_API_KEY!

function detectUrlType(url: string): 'linkedin' | 'twitter' | 'other' {
  if (url.includes('linkedin.com/in/')) return 'linkedin'
  if (url.includes('twitter.com/') || url.includes('x.com/')) return 'twitter'
  return 'other'
}

function normalizeLinkedInUrl(url: string): string {
  // Strip query params and trailing slashes; ensure https
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return `https://www.linkedin.com${u.pathname.replace(/\/$/, '')}`
  } catch {
    return url
  }
}

function extractTwitterHandle(url: string): string {
  return url.split('/').filter(Boolean).pop()?.split('?')[0] ?? ''
}

interface EnrichResult {
  matched_on: string
  matches: {
    confidence_score: number
    person_data: {
      basic_profile: { full_name?: string | null; current_title?: string | null }
      experience: {
        employment_details: {
          current: { name: string; title: string; is_default: boolean }[]
        }
      }
      social_handles?: {
        twitter_identifier?: { slug?: string | null } | null
      } | null
    }
  }[]
}

export interface AddPersonResult {
  ok: boolean
  person?: {
    id: string
    full_name: string
    current_title: string | null
    current_company: string | null
    linkedin_url: string | null
    twitter_handle: string | null
  }
  error?: string
  alreadyExists?: boolean
}

export async function addPerson(_prev: AddPersonResult, formData: FormData): Promise<AddPersonResult> {
  const rawUrl = (formData.get('url') as string | null)?.trim() ?? ''
  if (!rawUrl) return { ok: false, error: 'Please enter a URL.' }

  const urlType = detectUrlType(rawUrl)

  let linkedinUrl: string | null = null
  let twitterHandle: string | null = null
  let fullName: string | null = null
  let currentTitle: string | null = null
  let currentCompany: string | null = null

  if (urlType === 'linkedin') {
    linkedinUrl = normalizeLinkedInUrl(rawUrl)

    const res = await fetch(ENRICH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CRUSTDATA_KEY}`,
        'Content-Type': 'application/json',
        'x-api-version': '2025-11-01',
      },
      body: JSON.stringify({
        professional_network_profile_urls: [linkedinUrl],
        fields: ['basic_profile', 'experience', 'social_handles'],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `Crustdata error: ${err.slice(0, 120)}` }
    }

    const results = (await res.json()) as EnrichResult[]
    const match = results[0]?.matches?.[0]
    if (!match) return { ok: false, error: 'Could not find this profile on Crustdata. Check the URL and try again.' }

    const pd = match.person_data
    fullName = pd.basic_profile?.full_name ?? null
    currentTitle = pd.basic_profile?.current_title ?? null
    const defaultEntry = pd.experience?.employment_details?.current?.find(e => e.is_default)
    currentCompany = defaultEntry?.name ?? null
    twitterHandle = pd.social_handles?.twitter_identifier?.slug ?? null

  } else if (urlType === 'twitter') {
    twitterHandle = extractTwitterHandle(rawUrl)
    // We don't have enough info yet — store what we know; enrichment cron will flesh out later
  } else {
    return { ok: false, error: 'Paste a LinkedIn (linkedin.com/in/...) or X/Twitter (x.com/...) URL.' }
  }

  if (!fullName && urlType === 'linkedin') {
    return { ok: false, error: 'Could not extract a name from this profile.' }
  }

  // Use a placeholder name for Twitter-only adds; user can update later
  const nameToStore = fullName ?? (twitterHandle ? `@${twitterHandle}` : 'Unknown')

  const row = {
    full_name: nameToStore,
    linkedin_url: linkedinUrl,
    twitter_handle: twitterHandle,
    current_title: currentTitle,
    current_company: currentCompany,
    tier_1_alum: true,       // include in enrichment cron so we track future changes
    tier_1_companies: [],
    prior_companies: [],
    last_enriched_at: linkedinUrl ? new Date().toISOString() : null,
  }

  // Try insert; on conflict (linkedin_url already exists) update metadata instead
  const insertRes = await fetch(
    `${SUPABASE_URL}/rest/v1/sourcing_people?on_conflict=linkedin_url`,
    {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([row]),
    },
  )

  if (!insertRes.ok) {
    const err = await insertRes.text()
    return { ok: false, error: `Failed to save: ${err.slice(0, 120)}` }
  }

  const saved = ((await insertRes.json()) as { id: string; full_name: string; current_title: string | null; current_company: string | null; linkedin_url: string | null; twitter_handle: string | null }[])[0]

  return {
    ok: true,
    person: {
      id: saved.id,
      full_name: saved.full_name,
      current_title: saved.current_title,
      current_company: saved.current_company,
      linkedin_url: saved.linkedin_url,
      twitter_handle: saved.twitter_handle,
    },
  }
}
