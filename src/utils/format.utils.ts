// ─── F-08: Indian Rupee formatting ────────────────────────────────────────────
// Single shared formatter. Indian numbering only (lakh / crore) — never K-style
// thousands, never USD millions, never scientific notation. All client-facing
// monetary values must pass through here.

/** Trim trailing zeros: 45.00 → "45", 1.20 → "1.2", 1.25 → "1.25". */
function trim(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, '')
}

/** Compact lakh/crore shorthand without the ₹ symbol: 4500000 → "45L", 12000000 → "1.2Cr". */
export function shorthandINR(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 10000000) return `${sign}${trim(abs / 10000000)}Cr`
  if (abs >= 100000) return `${sign}${trim(abs / 100000)}L`
  return `${sign}${Math.round(abs).toLocaleString('en-IN')}`
}

/**
 * Format a number as Indian currency.
 * - compact (default): ₹ + lakh/crore shorthand (₹45L, ₹1.2Cr); full grouped number below ₹1L.
 * - compact=false: full grouped Indian number (₹45,00,000).
 */
export function formatCurrency(amount: number, compact = true): string {
  if (!compact) {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`
  }
  return `₹${shorthandINR(amount)}`
}

/**
 * F-08 client-facing format: full Indian number with shorthand in parentheses for
 * large values — "₹45,00,000 (₹45L)". Below ₹1 lakh, shows just the full number.
 */
export function formatCurrencyWithShorthand(amount: number): string {
  const full = `₹${Math.round(amount).toLocaleString('en-IN')}`
  if (Math.abs(amount) < 100000) return full
  return `${full} (₹${shorthandINR(amount)})`
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
