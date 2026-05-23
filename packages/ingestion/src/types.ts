/**
 * Shared interfaces for all signal source connectors.
 * Each connector in packages/ingestion/src/sources/ implements SignalSource.
 */

export interface IngestionContext {
  supabaseUrl: string
  serviceRoleKey: string
  crustdataApiKey: string
  sinceAt: Date
  dryRun?: boolean
}

export interface RawSignal {
  signal_type:
    | 'stealth_entry'
    | 'job_change'
    | 'new_company'
    | 'hiring_spike'
    | 'domain_registered'
    | 'github_org_created'
    | 'delaware_filing'
  source: 'crustdata' | 'github' | 'opencorporates' | 'whois'
  person_linkedin_url?: string
  company_name?: string
  event_at: Date
  summary: string
  evidence: Record<string, unknown>
}

export interface SignalBatch {
  signals: RawSignal[]
  peopleUpdates: PeopleUpdate[]
  runMetadata: {
    source: string
    startedAt: Date
    completedAt: Date
    signalsProduced: number
    errors: string[]
  }
}

export interface PeopleUpdate {
  id?: string
  linkedin_url: string
  full_name?: string
  current_title?: string
  current_company?: string
  last_enriched_at: Date
  data?: Record<string, unknown>
}

export interface SignalSource {
  id: string
  run(ctx: IngestionContext): Promise<SignalBatch>
}
