import type { SignalSource, IngestionContext, SignalBatch, RawSignal, PeopleUpdate } from '../types'

const GH_API = 'https://api.github.com'
const REQUEST_DELAY_MS = 250

interface TrackedPerson {
  id: string
  linkedin_url: string
  github_username: string
  full_name: string | null
}

interface GhOrg {
  login: string
}

interface GhOrgDetail {
  login: string
  name: string | null
  created_at: string
}

async function ghFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (res.status === 404) return [] as unknown as T
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub ${path} (${res.status}): ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

async function fetchPeopleWithGitHub(
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<TrackedPerson[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/sourcing_people?github_username=not.is.null&select=id,linkedin_url,github_username,full_name`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  )
  if (!res.ok) throw new Error(`People fetch (${res.status})`)
  return res.json() as Promise<TrackedPerson[]>
}

export const githubWatch: SignalSource = {
  id: 'github-watch',

  async run(ctx: IngestionContext): Promise<SignalBatch> {
    const startedAt = new Date()
    const signals: RawSignal[] = []
    const peopleUpdates: PeopleUpdate[] = []
    const errors: string[] = []

    if (!ctx.githubPat) {
      return {
        signals,
        peopleUpdates,
        runMetadata: {
          source: 'github-watch',
          startedAt,
          completedAt: new Date(),
          signalsProduced: 0,
          errors: ['GITHUB_PAT not configured — skipping'],
        },
      }
    }

    const people = await fetchPeopleWithGitHub(ctx.supabaseUrl, ctx.serviceRoleKey)

    for (const person of people) {
      // Always include so urlToPersonId map is populated for any signals this person generates
      peopleUpdates.push({
        id: person.id,
        linkedin_url: person.linkedin_url,
        last_enriched_at: new Date(),
      })

      let orgs: GhOrg[]
      try {
        orgs = await ghFetch<GhOrg[]>(
          `/users/${encodeURIComponent(person.github_username)}/orgs`,
          ctx.githubPat
        )
        await new Promise(r => setTimeout(r, REQUEST_DELAY_MS))
      } catch (err) {
        errors.push(`${person.github_username} orgs: ${(err as Error).message}`)
        await new Promise(r => setTimeout(r, REQUEST_DELAY_MS))
        continue
      }

      for (const org of orgs) {
        let detail: GhOrgDetail
        try {
          detail = await ghFetch<GhOrgDetail>(
            `/orgs/${encodeURIComponent(org.login)}`,
            ctx.githubPat
          )
          await new Promise(r => setTimeout(r, REQUEST_DELAY_MS))
        } catch (err) {
          errors.push(`org ${org.login}: ${(err as Error).message}`)
          continue
        }

        const createdAt = new Date(detail.created_at)
        if (createdAt < ctx.sinceAt) continue

        signals.push({
          signal_type: 'github_org_created',
          source: 'github',
          person_linkedin_url: person.linkedin_url,
          event_at: createdAt,
          summary: `${person.full_name ?? person.github_username} created GitHub org ${detail.name ?? org.login}`,
          evidence: {
            github_username: person.github_username,
            org_login: org.login,
            org_name: detail.name,
            org_created_at: detail.created_at,
          },
        })
      }
    }

    return {
      signals,
      peopleUpdates,
      runMetadata: {
        source: 'github-watch',
        startedAt,
        completedAt: new Date(),
        signalsProduced: signals.length,
        errors,
      },
    }
  },
}
