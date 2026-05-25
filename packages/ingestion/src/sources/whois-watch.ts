import type { SignalSource, IngestionContext, SignalBatch, RawSignal, PeopleUpdate } from '../types'

const WHOXY_API = 'https://api.whoxy.com'
const REQUEST_DELAY_MS = 500

interface TrackedPerson {
  id: string
  linkedin_url: string
  full_name: string
}

interface WhoisDomain {
  domain_name: string
  create_date?: string
  registrant_contact?: {
    full_name?: string | null
    company_name?: string | null
    email_address?: string | null
  }
}

interface ReverseWhoisResponse {
  status: number
  total_results?: number
  search_result?: WhoisDomain[]
}

interface LiveWhoisResponse {
  status: number
  domain_name?: string
  create_date?: string
}

async function fetchTrackedPeople(supabaseUrl: string, serviceRoleKey: string): Promise<TrackedPerson[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/sourcing_people?tier_1_alum=eq.true&full_name=not.is.null&select=id,linkedin_url,full_name`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  )
  if (!res.ok) throw new Error(`People fetch (${res.status})`)
  const rows = (await res.json()) as Array<{ id: string; linkedin_url: string; full_name: string | null }>
  return rows.filter((r): r is TrackedPerson => r.full_name !== null)
}

async function reverseWhoisByName(name: string, apiKey: string): Promise<WhoisDomain[]> {
  const url = `${WHOXY_API}/?key=${encodeURIComponent(apiKey)}&reverse=whois&name=${encodeURIComponent(name)}`
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`reverse WHOIS (${res.status}): ${text.slice(0, 200)}`)
  }
  const data = (await res.json()) as ReverseWhoisResponse
  if (data.status !== 1) return []
  return data.search_result ?? []
}

async function liveWhois(domain: string, apiKey: string): Promise<LiveWhoisResponse> {
  const url = `${WHOXY_API}/?key=${encodeURIComponent(apiKey)}&whois=${encodeURIComponent(domain)}`
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`live WHOIS (${res.status}): ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<LiveWhoisResponse>
}

function parseWhoisDate(s?: string): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

// Loose match: registrant name contains person's first and last name tokens
function nameMatches(registrantName: string | null | undefined, personName: string): boolean {
  if (!registrantName) return false
  const reg = registrantName.toLowerCase()
  const tokens = personName.toLowerCase().split(/\s+/).filter(t => t.length > 1)
  return tokens.every(t => reg.includes(t))
}

export const whoisWatch: SignalSource = {
  id: 'whois-watch',

  async run(ctx: IngestionContext): Promise<SignalBatch> {
    const startedAt = new Date()
    const signals: RawSignal[] = []
    const peopleUpdates: PeopleUpdate[] = []
    const errors: string[] = []

    if (!ctx.whoisApiKey) {
      return {
        signals,
        peopleUpdates,
        runMetadata: {
          source: 'whois-watch',
          startedAt,
          completedAt: new Date(),
          signalsProduced: 0,
          errors: ['WHOXY_API_KEY not configured — skipping'],
        },
      }
    }

    const people = await fetchTrackedPeople(ctx.supabaseUrl, ctx.serviceRoleKey)

    for (const person of people) {
      // Always include so urlToPersonId map is populated for any signals this person generates
      peopleUpdates.push({
        id: person.id,
        linkedin_url: person.linkedin_url,
        last_enriched_at: new Date(),
      })

      let domains: WhoisDomain[]
      try {
        domains = await reverseWhoisByName(person.full_name, ctx.whoisApiKey)
        await new Promise(r => setTimeout(r, REQUEST_DELAY_MS))
      } catch (err) {
        errors.push(`${person.full_name} reverse WHOIS: ${(err as Error).message}`)
        await new Promise(r => setTimeout(r, REQUEST_DELAY_MS))
        continue
      }

      for (const domain of domains) {
        let createdAt = parseWhoisDate(domain.create_date)

        // Reverse WHOIS may omit create_date — fall back to a live lookup
        if (!createdAt) {
          try {
            const live = await liveWhois(domain.domain_name, ctx.whoisApiKey)
            createdAt = parseWhoisDate(live.create_date)
            await new Promise(r => setTimeout(r, REQUEST_DELAY_MS))
          } catch (err) {
            errors.push(`live WHOIS ${domain.domain_name}: ${(err as Error).message}`)
            continue
          }
        }

        if (!createdAt || createdAt < ctx.sinceAt) continue

        // Verify registrant name matches to reduce false positives
        if (!nameMatches(domain.registrant_contact?.full_name, person.full_name)) continue

        signals.push({
          signal_type: 'domain_registered',
          source: 'whois',
          person_linkedin_url: person.linkedin_url,
          event_at: createdAt,
          summary: `${person.full_name} registered ${domain.domain_name}`,
          evidence: {
            domain_name: domain.domain_name,
            registrant_name: domain.registrant_contact?.full_name,
            registrant_company: domain.registrant_contact?.company_name,
            create_date: domain.create_date,
          },
        })
      }
    }

    return {
      signals,
      peopleUpdates,
      runMetadata: {
        source: 'whois-watch',
        startedAt,
        completedAt: new Date(),
        signalsProduced: signals.length,
        errors,
      },
    }
  },
}
