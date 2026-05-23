import { NextRequest, NextResponse } from 'next/server'
import { crustdataPersonFlow } from '@nev/ingestion'
import type { RawSignal, PeopleUpdate } from '@nev/ingestion'

export const maxDuration = 300

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRUSTDATA_KEY = process.env.CRUSTDATA_API_KEY!
const CRON_SECRET = process.env.CRON_SECRET!

const headers = (serviceRoleKey: string) => ({
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
})

async function writeSignals(
  signals: RawSignal[],
  urlToPersonId: Map<string, string>
): Promise<{ inserted: number; skipped: number; error?: string }> {
  if (!signals.length) return { inserted: 0, skipped: 0 }

  const rows = signals
    .map(s => {
      const personId = s.person_linkedin_url ? urlToPersonId.get(s.person_linkedin_url) : undefined
      if (!personId) return null

      // Day-truncate event_at — dedup index is (person_id, signal_type, event_at)
      const eventAt = new Date(s.event_at)
      eventAt.setUTCHours(0, 0, 0, 0)

      return {
        signal_type: s.signal_type,
        source: s.source,
        person_id: personId,
        event_at: eventAt.toISOString(),
        summary: s.summary,
        evidence: s.evidence,
      }
    })
    .filter(Boolean)

  if (!rows.length) return { inserted: 0, skipped: signals.length }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/sourcing_signals?on_conflict=person_id,signal_type,event_at`,
    {
      method: 'POST',
      headers: {
        ...headers(SERVICE_ROLE_KEY),
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return { inserted: 0, skipped: 0, error: `signals (${res.status}): ${err.slice(0, 200)}` }
  }

  return { inserted: rows.length, skipped: signals.length - rows.length }
}

async function writePeopleUpdates(
  updates: PeopleUpdate[]
): Promise<{ updated: number; error?: string }> {
  if (!updates.length) return { updated: 0 }

  const rows = updates.map(u => ({
    id: u.id,
    linkedin_url: u.linkedin_url,
    ...(u.full_name !== undefined ? { full_name: u.full_name } : {}),
    ...(u.current_title !== undefined ? { current_title: u.current_title } : {}),
    ...(u.current_company !== undefined ? { current_company: u.current_company } : {}),
    last_enriched_at: u.last_enriched_at.toISOString(),
    ...(u.data ? { data: u.data } : {}),
  }))

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/sourcing_people?on_conflict=linkedin_url`,
    {
      method: 'POST',
      headers: {
        ...headers(SERVICE_ROLE_KEY),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return { updated: 0, error: `people (${res.status}): ${err.slice(0, 200)}` }
  }

  return { updated: rows.length }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const batch = await crustdataPersonFlow.run({
      supabaseUrl: SUPABASE_URL,
      serviceRoleKey: SERVICE_ROLE_KEY,
      crustdataApiKey: CRUSTDATA_KEY,
      sinceAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    })

    const urlToPersonId = new Map<string, string>()
    for (const u of batch.peopleUpdates) {
      if (u.id && u.linkedin_url) urlToPersonId.set(u.linkedin_url, u.id)
    }

    const [signalResult, peopleResult] = await Promise.all([
      writeSignals(batch.signals, urlToPersonId),
      writePeopleUpdates(batch.peopleUpdates),
    ])

    const errors = [
      ...batch.runMetadata.errors,
      ...(signalResult.error ? [signalResult.error] : []),
      ...(peopleResult.error ? [peopleResult.error] : []),
    ]

    return NextResponse.json({
      ok: errors.length === 0,
      run: batch.runMetadata,
      signals: signalResult,
      people: peopleResult,
      errors,
    })
  } catch (err) {
    console.error('ingest error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
