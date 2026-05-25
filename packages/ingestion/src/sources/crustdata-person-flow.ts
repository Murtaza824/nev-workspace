import type { SignalSource, IngestionContext, SignalBatch, RawSignal, PeopleUpdate } from '../types'

const ENRICH_URL = 'https://api.crustdata.com/person/enrich'
const BATCH_SIZE = 25
const BATCH_DELAY_MS = 500

interface StoredPerson {
  id: string
  linkedin_url: string
  full_name: string
  current_title: string | null
  current_company: string | null
}

interface CurrentEntry {
  name: string
  title: string
  is_default: boolean
}

interface SocialHandles {
  dev_platform_identifier?: { profile_url?: string | null } | null
  twitter_identifier?: { slug?: string | null } | null
}

interface DevPlatformProfile {
  platform?: string
  profile_url?: string | null
  username?: string | null
}

interface CrustMatch {
  confidence_score: number
  person_data: {
    basic_profile: { current_title?: string | null }
    experience: {
      employment_details: {
        current: CurrentEntry[]
      }
    }
    social_handles?: SocialHandles | null
    dev_platform_profiles?: DevPlatformProfile[] | null
  }
}

interface EnrichResult {
  matched_on: string
  matches: CrustMatch[]
}

function extractGitHubUsername(
  social_handles?: SocialHandles | null,
  dev_platform_profiles?: DevPlatformProfile[] | null
): string | undefined {
  const devUrl = social_handles?.dev_platform_identifier?.profile_url
  if (devUrl?.includes('github.com')) {
    const username = devUrl.split('github.com/')[1]?.split('/')[0]?.split('?')[0]
    if (username) return username
  }
  const ghProfile = dev_platform_profiles?.find(
    p => p.platform?.toLowerCase() === 'github' || p.profile_url?.includes('github.com')
  )
  if (ghProfile?.username) return ghProfile.username
  if (ghProfile?.profile_url) {
    const username = ghProfile.profile_url.split('github.com/')[1]?.split('/')[0]?.split('?')[0]
    if (username) return username
  }
  return undefined
}

function isStealthTitle(title: string | null | undefined): boolean {
  if (!title || title.trim() === '') return true
  return /\b(stealth|building|founder|co-founder|cofounder)\b/i.test(title)
}

function isExecTitle(title: string | null | undefined): boolean {
  if (!title) return false
  return /\b(ceo|cto|coo|cpo|chief|president)\b/i.test(title)
}

async function fetchBatch(urls: string[], apiKey: string): Promise<EnrichResult[]> {
  const res = await fetch(ENRICH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'x-api-version': '2025-11-01',
    },
    body: JSON.stringify({
      professional_network_profile_urls: urls,
      fields: ['basic_profile', 'experience', 'social_handles', 'dev_platform_profiles'],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Crustdata enrich (${res.status}): ${err.slice(0, 200)}`)
  }
  return res.json() as Promise<EnrichResult[]>
}

async function fetchAlumni(supabaseUrl: string, serviceRoleKey: string): Promise<StoredPerson[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/sourcing_people?tier_1_alum=eq.true&select=id,linkedin_url,full_name,current_title,current_company`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  )
  if (!res.ok) throw new Error(`Alumni fetch (${res.status})`)
  return res.json() as Promise<StoredPerson[]>
}

export const crustdataPersonFlow: SignalSource = {
  id: 'crustdata-person-flow',

  async run(ctx: IngestionContext): Promise<SignalBatch> {
    const startedAt = new Date()
    const signals: RawSignal[] = []
    const peopleUpdates: PeopleUpdate[] = []
    const errors: string[] = []

    const people = await fetchAlumni(ctx.supabaseUrl, ctx.serviceRoleKey)
    const byUrl = new Map(people.map(p => [p.linkedin_url, p]))

    for (let i = 0; i < people.length; i += BATCH_SIZE) {
      const batch = people.slice(i, i + BATCH_SIZE)
      const urls = batch.map(p => p.linkedin_url)

      let results: EnrichResult[]
      try {
        results = await fetchBatch(urls, ctx.crustdataApiKey)
      } catch (err) {
        errors.push(`batch ${Math.floor(i / BATCH_SIZE) + 1}: ${(err as Error).message}`)
        if (i + BATCH_SIZE < people.length) await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
        continue
      }

      for (const result of results) {
        const person = byUrl.get(result.matched_on)
        if (!person || !result.matches.length) continue

        const pd = result.matches[0].person_data
        const confidence = result.matches[0].confidence_score

        const newTitle = pd.basic_profile?.current_title ?? null
        const defaultEntry = pd.experience?.employment_details?.current?.find(e => e.is_default)
        const newCompany = defaultEntry?.name ?? null
        const githubUsername = extractGitHubUsername(pd.social_handles, pd.dev_platform_profiles)
        const twitterHandle = pd.social_handles?.twitter_identifier?.slug ?? undefined

        // First run: current_title is NULL — establish baseline, emit nothing
        if (person.current_title === null) {
          peopleUpdates.push({
            id: person.id,
            linkedin_url: person.linkedin_url,
            full_name: person.full_name,
            current_title: newTitle ?? undefined,
            current_company: newCompany ?? undefined,
            github_username: githubUsername,
            twitter_handle: twitterHandle,
            last_enriched_at: new Date(),
          })
          continue
        }

        const titleChanged = newTitle !== person.current_title
        const companyChanged = newCompany !== person.current_company

        if (!titleChanged && !companyChanged) {
          peopleUpdates.push({
            id: person.id,
            linkedin_url: person.linkedin_url,
            full_name: person.full_name,
            github_username: githubUsername,
            twitter_handle: twitterHandle,
            last_enriched_at: new Date(),
          })
          continue
        }

        // Exec title change within same company = internal promotion, not a signal
        if (isExecTitle(newTitle) && !companyChanged) {
          peopleUpdates.push({
            id: person.id,
            linkedin_url: person.linkedin_url,
            full_name: person.full_name,
            current_title: newTitle ?? undefined,
            github_username: githubUsername,
            twitter_handle: twitterHandle,
            last_enriched_at: new Date(),
          })
          continue
        }

        const signalType: RawSignal['signal_type'] = isStealthTitle(newTitle)
          ? 'stealth_entry'
          : 'job_change'

        signals.push({
          signal_type: signalType,
          source: 'crustdata',
          person_linkedin_url: person.linkedin_url,
          event_at: new Date(),
          summary: `${person.full_name}: "${person.current_title ?? ''}" → "${newTitle ?? ''}" at ${newCompany ?? 'unknown'}`,
          evidence: {
            previous_title: person.current_title,
            previous_company: person.current_company,
            new_title: newTitle,
            new_company: newCompany,
            confidence_score: confidence,
          },
        })

        peopleUpdates.push({
          id: person.id,
          linkedin_url: person.linkedin_url,
          full_name: person.full_name,
          current_title: newTitle ?? undefined,
          current_company: newCompany ?? undefined,
          github_username: githubUsername,
          twitter_handle: twitterHandle,
          last_enriched_at: new Date(),
        })
      }

      if (i + BATCH_SIZE < people.length) await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    }

    return {
      signals,
      peopleUpdates,
      runMetadata: {
        source: 'crustdata-person-flow',
        startedAt,
        completedAt: new Date(),
        signalsProduced: signals.length,
        errors,
      },
    }
  },
}
