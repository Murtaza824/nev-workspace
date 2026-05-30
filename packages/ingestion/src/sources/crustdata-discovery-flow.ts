const SEARCH_URL = 'https://api.crustdata.com/person/search'
const RESULTS_PER_PAGE = 25
const MAX_PER_COMPANY = 250
const PAGE_DELAY_MS = 600
const COMPANY_DELAY_MS = 1000

// Verify these slugs against linkedin.com/company/<slug> if a company returns zero results.
const TIER_1_COMPANIES = [
  { name: 'OpenAI',    linkedinUrl: 'https://www.linkedin.com/company/openai' },
  { name: 'Anthropic', linkedinUrl: 'https://www.linkedin.com/company/anthropicresearch' },
  { name: 'Stripe',    linkedinUrl: 'https://www.linkedin.com/company/stripe' },
  { name: 'DeepMind',  linkedinUrl: 'https://www.linkedin.com/company/deepmind' },
  { name: 'Ramp',      linkedinUrl: 'https://www.linkedin.com/company/ramp' },
  { name: 'SpaceX',    linkedinUrl: 'https://www.linkedin.com/company/spacex' },
  { name: 'Anduril',   linkedinUrl: 'https://www.linkedin.com/company/anduril-industries' },
  { name: 'Palantir',  linkedinUrl: 'https://www.linkedin.com/company/palantir-technologies' },
]

export interface DiscoveryContext {
  supabaseUrl: string
  serviceRoleKey: string
  crustdataApiKey: string
}

export interface DiscoveryResult {
  discovered: number
  inserted: number
  errors: string[]
  byCompany: Record<string, { discovered: number; inserted: number }>
}

interface CrustProfile {
  basic_profile?: { name?: string | null }
  social_handles?: {
    professional_network_identifier?: { profile_url?: string | null } | null
  }
}

interface SearchResponse {
  profiles?: CrustProfile[]
  next_cursor?: string | null
}

async function searchPage(
  linkedinUrl: string,
  apiKey: string,
  cursor?: string,
): Promise<SearchResponse> {
  const body: Record<string, unknown> = {
    filters: {
      op: 'and',
      conditions: [
        {
          field: 'experience.employment_details.past.company_professional_network_profile_url',
          type: '=',
          value: linkedinUrl,
        },
        {
          // Exclude interns/students — they're not founder signals
          field: 'experience.employment_details.title',
          type: 'not_in',
          value: ['Intern', 'Internship', 'Student', 'Fellow'],
        },
      ],
    },
    fields: ['basic_profile', 'social_handles'],
    limit: RESULTS_PER_PAGE,
  }
  if (cursor) body.next_cursor = cursor

  const res = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'x-api-version': '2025-11-01',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Crustdata search (${res.status}): ${err.slice(0, 200)}`)
  }

  return res.json() as Promise<SearchResponse>
}

async function insertPeople(
  people: { linkedin_url: string; full_name: string; company: string }[],
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<{ inserted: number; error?: string }> {
  if (!people.length) return { inserted: 0 }

  const rows = people.map(p => ({
    linkedin_url: p.linkedin_url,
    full_name: p.full_name,
    tier_1_alum: true,
    tier_1_companies: [p.company],
    prior_companies: [p.company],
    // current_title intentionally omitted — null triggers baseline-establish on first enrichment run
  }))

  const res = await fetch(
    `${supabaseUrl}/rest/v1/sourcing_people?on_conflict=linkedin_url`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    return { inserted: 0, error: `insert (${res.status}): ${err.slice(0, 200)}` }
  }

  return { inserted: rows.length }
}

export async function runDiscoveryFlow(ctx: DiscoveryContext): Promise<DiscoveryResult> {
  const errors: string[] = []
  const byCompany: Record<string, { discovered: number; inserted: number }> = {}
  let totalDiscovered = 0
  let totalInserted = 0

  for (const company of TIER_1_COMPANIES) {
    byCompany[company.name] = { discovered: 0, inserted: 0 }
    let cursor: string | undefined
    let fetched = 0

    while (fetched < MAX_PER_COMPANY) {
      let page: SearchResponse
      try {
        page = await searchPage(company.linkedinUrl, ctx.crustdataApiKey, cursor)
      } catch (err) {
        errors.push(`${company.name}: ${(err as Error).message}`)
        break
      }

      const profiles = page.profiles ?? []
      if (!profiles.length) break

      const people = profiles.flatMap(p => {
        const linkedinUrl = p.social_handles?.professional_network_identifier?.profile_url
        const name = p.basic_profile?.name
        if (!linkedinUrl || !name) return []
        return [{ linkedin_url: linkedinUrl, full_name: name, company: company.name }]
      })

      fetched += profiles.length
      totalDiscovered += people.length
      byCompany[company.name].discovered += people.length

      if (people.length) {
        const result = await insertPeople(people, ctx.supabaseUrl, ctx.serviceRoleKey)
        if (result.error) {
          errors.push(`${company.name} insert: ${result.error}`)
        } else {
          totalInserted += result.inserted
          byCompany[company.name].inserted += result.inserted
        }
      }

      cursor = page.next_cursor ?? undefined
      if (!cursor) break

      await new Promise(r => setTimeout(r, PAGE_DELAY_MS))
    }

    await new Promise(r => setTimeout(r, COMPANY_DELAY_MS))
  }

  return { discovered: totalDiscovered, inserted: totalInserted, errors, byCompany }
}
