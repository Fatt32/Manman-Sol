import { describe, it, expect } from 'vitest'
import { pwochènDatePeman, dateLimitPeryod, fmtMontan } from '@/lib/utils'

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

describe('monthly sol calendar', () => {
  it('period 1 starts on the 1st of the start month', () => {
    expect(ymd(pwochènDatePeman('2026-05-21', 1, 'chak-mwa'))).toBe('2026-05-01')
  })
  it('rolls over the year', () => {
    expect(ymd(pwochènDatePeman('2026-11-01', 3, 'chak-mwa'))).toBe('2027-01-01')
  })
  it('deadline is the last day of the month, leap years included', () => {
    expect(ymd(dateLimitPeryod('2028-01-01', 2, 'chak-mwa'))).toBe('2028-02-29')
    expect(ymd(dateLimitPeryod('2026-01-01', 4, 'chak-mwa'))).toBe('2026-04-30')
  })
})

describe('weekly sol calendar', () => {
  it('deadline is the day before the next period', () => {
    expect(ymd(pwochènDatePeman('2026-10-05', 2, 'chak-semèn'))).toBe('2026-10-12')
    expect(ymd(dateLimitPeryod('2026-10-05', 1, 'chak-semèn'))).toBe('2026-10-11')
  })
})

describe('fmtMontan', () => {
  it('formats both currencies', () => {
    expect(fmtMontan(45000, 'HTG')).toBe('45,000 G')
    expect(fmtMontan(250, 'USD')).toBe('$250')
  })
})
