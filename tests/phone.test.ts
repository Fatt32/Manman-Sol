import { describe, it, expect } from 'vitest'
import { normalizePhone, samePhone } from '@/lib/phone'

describe('normalizePhone', () => {
  it('adds +509 to an 8-digit Haitian number', () => {
    expect(normalizePhone('4914 6170')).toBe('50949146170')
    expect(normalizePhone('+509 4914-6170')).toBe('50949146170')
    expect(normalizePhone('00509 49146170')).toBe('50949146170')
  })
  it('adds +1 to a 10-digit US number', () => {
    expect(normalizePhone('(305) 555-1234')).toBe('13055551234')
    expect(normalizePhone('+1 305 555 1234')).toBe('13055551234')
  })
})

describe('samePhone', () => {
  it('matches the same Haitian number written two ways', () => {
    expect(samePhone('49146170', '+509 4914 6170')).toBe(true)
  })
  it('no longer confuses a Haitian and a US number that share the last 8 digits', () => {
    expect(samePhone('49146170', '(214) 914-6170')).toBe(false)
  })
  it('never matches empty input', () => {
    expect(samePhone('', '')).toBe(false)
  })
})
