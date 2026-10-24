/* ── Phone numbers ──────────────────────────────────────────────────────
 * Members are stored with whatever the chef typed ("4914 6170",
 * "+509 4914-6170", "(305) 555-1234"). Comparing only the last 8 digits
 * let a Haitian number and a US number collide, so we compare the full
 * number with its country code instead.
 *   8 digits            → Haiti, +509
 *   10 digits           → USA / Canada, +1
 *   11 digits, "1…"     → USA / Canada
 *   anything else       → kept as typed (digits only)
 */
export function normalizePhone(raw: string | null | undefined): string {
  const d = String(raw ?? '').replace(/\D/g, '').replace(/^00/, '')
  if (d.length === 8) return `509${d}`
  if (d.length === 10) return `1${d}`
  return d
}

export function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizePhone(a)
  return na.length >= 8 && na === normalizePhone(b)
}
