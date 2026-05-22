/**
 * Phase 1 seed script — populates sourcing_people with tier-1 alumni.
 *
 * Uses Crustdata PAST_COMPANY preview (5 credits/call) to find ex-employees
 * of the 8 tier-1 companies. Writes to Supabase via REST API (no SDK needed).
 *
 * Run from workspace root:
 *   npx tsx apps/sourcing/scripts/seed-alumni.ts
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// Load .env.local from the sourcing app directory
const envPath = path.join(__dirname, '../.env.local')
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const eq = line.indexOf('=')
  if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRUSTDATA_KEY = process.env.CRUSTDATA_API_KEY!

const TIER_1_COMPANIES = [
  'OpenAI',
  'Anthropic',
  'Stripe',
  'DeepMind',
  'Ramp',
  'SpaceX',
  'Anduril',
  'Palantir',
]

interface CrustdataProfile {
  linkedin_profile_url: string
  linkedin_profile_urn: string
  name: string
  location?: string
  default_position_title?: string
}

function classifySeniority(title?: string): string | null {
  if (!title) return null
  const t = title.toLowerCase()
  if (t.match(/\b(founder|co-founder|ceo|cto|cpo|coo|chief)\b/)) return 'founder'
  if (t.match(/\b(vp|vice president|head of|director|partner)\b/)) return 'vp'
  if (t.match(/\b(staff|principal|distinguished|fellow)\b/)) return 'staff'
  if (t.match(/\b(senior|sr\.?|lead)\b/)) return 'senior'
  return 'ic'
}

async function fetchExEmployees(company: string): Promise<CrustdataProfile[]> {
  const res = await fetch('https://api.crustdata.com/screener/person/search', {
    method: 'POST',
    headers: {
      Authorization: `Token ${CRUSTDATA_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      filters: [
        { filter_type: 'PAST_COMPANY', type: 'in', value: [company] },
        { filter_type: 'REGION', type: 'in', value: ['United States'] },
      ],
      preview: true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.warn(`  Crustdata error for ${company} (${res.status}): ${err.slice(0, 200)}`)
    return []
  }

  const data = await res.json() as { profiles?: CrustdataProfile[] }
  return data.profiles ?? []
}

async function supabaseUpsert(rows: object[]): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/sourcing_people?on_conflict=linkedin_url`,
    {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase upsert failed (${res.status}): ${err.slice(0, 300)}`)
  }
}

async function supabaseCount(): Promise<number> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/sourcing_people?tier_1_alum=eq.true&select=id`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'count=exact',
        'Range-Unit': 'items',
        Range: '0-0',
      },
    }
  )
  const contentRange = res.headers.get('Content-Range') ?? ''
  const match = contentRange.match(/\/(\d+)$/)
  return match ? parseInt(match[1], 10) : 0
}

async function main() {
  const seen = new Map<string, { tier_1_companies: string[] } & Record<string, unknown>>()

  for (const company of TIER_1_COMPANIES) {
    console.log(`Fetching ex-employees of ${company}...`)
    const profiles = await fetchExEmployees(company)
    console.log(`  Got ${profiles.length} profiles`)

    for (const p of profiles) {
      const existing = seen.get(p.linkedin_profile_url)
      if (existing) {
        if (!existing.tier_1_companies.includes(company)) {
          existing.tier_1_companies.push(company)
        }
        continue
      }
      seen.set(p.linkedin_profile_url, {
        linkedin_url: p.linkedin_profile_url,
        full_name: p.name,
        current_title: p.default_position_title ?? null,
        location: p.location ?? null,
        tier_1_alum: true,
        tier_1_companies: [company],
        seniority_tier: classifySeniority(p.default_position_title),
        data: { crustdata_urn: p.linkedin_profile_urn },
      })
    }

    await new Promise(r => setTimeout(r, 1500))
  }

  const rows = [...seen.values()]
  console.log(`\nUpserting ${rows.length} unique people...`)

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50)
    await supabaseUpsert(batch)
    console.log(`  Batch ${Math.floor(i / 50) + 1}: upserted ${batch.length} rows`)
  }

  const total = await supabaseCount()
  console.log(`\nDone. sourcing_people has ${total} tier-1 alumni.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
