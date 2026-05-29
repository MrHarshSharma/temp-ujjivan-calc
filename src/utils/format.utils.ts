/** Format a number as Indian currency (₹ with lakh/crore abbreviation) */
export function formatCurrency(amount: number, compact = true): string {
  if (!compact) {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`
  return `${sign}₹${abs.toFixed(0)}`
}

/** Format a percentage with 1 decimal place */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/** Format years — "1 year" or "5 years" */
export function formatYears(years: number): string {
  return years === 1 ? '1 year' : `${years} years`
}

/** Calculate age from date of birth string */
export function ageFromDOB(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
