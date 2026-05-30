import { NextRequest, NextResponse } from 'next/server'
import { runDiscoveryFlow } from '@nev/ingestion'

export const maxDuration = 300

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRUSTDATA_KEY = process.env.CRUSTDATA_API_KEY!
const CRON_SECRET = process.env.CRON_SECRET!

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await runDiscoveryFlow({
      supabaseUrl: SUPABASE_URL,
      serviceRoleKey: SERVICE_ROLE_KEY,
      crustdataApiKey: CRUSTDATA_KEY,
    })

    return NextResponse.json({ ok: result.errors.length === 0, ...result })
  } catch (err) {
    console.error('discovery error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
