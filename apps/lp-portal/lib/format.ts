/**
 * Format a dollar amount to compact notation.
 * Examples:
 *   formatUSD(1300000) → "$1.30M"
 *   formatUSD(250000)  → "$250K"
 *   formatUSD(1250)    → "$1,250"
 *
 * Thresholds:
 *   >= 1,000,000  → millions with 2 decimal places  ($1.30M)
 *   >= 10,000     → thousands rounded to whole K     ($250K)
 *   < 10,000      → comma-formatted integer           ($1,250)
 */
export function formatUSD(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''

  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000
    // Strip trailing zeros: $13.00M → $13M, $1.30M → $1.3M, $1.56M → $1.56M
    const formatted = parseFloat(millions.toFixed(2)).toString()
    return `${sign}$${formatted}M`
  }

  if (abs >= 10_000) {
    const thousands = Math.round(abs / 1_000)
    return `${sign}$${thousands}K`
  }

  return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

/**
 * Format a multiple to two decimal places with "x" suffix.
 * Example: formatMult(1.2) → "1.20x"
 */
export function formatMult(n: number): string {
  return `${n.toFixed(2)}x`
}

/**
 * Format a date to "Apr 29, 2026" style.
 */
export function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
