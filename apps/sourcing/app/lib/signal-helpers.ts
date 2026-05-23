export const signalTypeColors: Record<string, { bg: string; fg: string }> = {
  stealth_entry:      { bg: '#EEEDFE', fg: '#3C3489' },
  job_change:         { bg: '#E6F1FB', fg: '#0C447C' },
  hiring_spike:       { bg: '#FBEAF0', fg: '#72243E' },
  new_company:        { bg: '#E1F5EE', fg: '#085041' },
  domain_registered:  { bg: '#E1F5EE', fg: '#085041' },
  github_org_created: { bg: '#E1F5EE', fg: '#085041' },
  delaware_filing:    { bg: '#E1F5EE', fg: '#085041' },
  build_in_public:    { bg: '#FAEEDA', fg: '#633806' },
}

export const signalTypeLabels: Record<string, string> = {
  stealth_entry:      'STEALTH',
  job_change:         'JOB CHANGE',
  hiring_spike:       'HIRING SPIKE',
  new_company:        'NEW CO',
  domain_registered:  'DOMAIN REG',
  github_org_created: 'GITHUB',
  delaware_filing:    'FILING',
  build_in_public:    'BUILD-IN-PUBLIC',
}

export const filterLabels: Record<string, string> = {
  stealth_entry:      'Stealth',
  job_change:         'Job changes',
  hiring_spike:       'Hiring spikes',
  new_company:        'New cos',
  domain_registered:  'Domain reg',
  github_org_created: 'GitHub',
  delaware_filing:    'Filings',
  build_in_public:    'Build-in-public',
}

export const FILTER_ORDER = [
  'stealth_entry',
  'job_change',
  'hiring_spike',
  'new_company',
  'domain_registered',
  'github_org_created',
  'delaware_filing',
  'build_in_public',
] as const

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSec < 60) return 'JUST NOW'
  if (diffMin < 60) return `${diffMin}M AGO`
  if (diffHours < 24) return `${diffHours}H AGO`
  if (diffDays < 7) return `${diffDays}D AGO`
  if (diffWeeks < 5) return `${diffWeeks}W AGO`
  if (diffMonths < 12) return `${diffMonths}MO AGO`
  return new Date(dateStr)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .toUpperCase()
}

export function getSourceIcon(source: string): string {
  switch (source) {
    case 'linkedin':       return 'ti-brand-linkedin'
    case 'twitter':        return 'ti-brand-x'
    case 'github':         return 'ti-git-fork'
    case 'crustdata':      return 'ti-database'
    case 'opencorporates': return 'ti-world'
    case 'whois':          return 'ti-world'
    default:               return 'ti-world'
  }
}

export function getSourceLabel(source: string): string {
  switch (source) {
    case 'crustdata': return 'LINKEDIN + CRUSTDATA'
    case 'linkedin':  return 'LINKEDIN'
    case 'twitter':   return 'TWITTER'
    case 'github':    return 'GITHUB'
    default:          return source.toUpperCase()
  }
}
