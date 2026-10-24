import { describe, it, expect } from 'vitest'
import { applySolUpdate } from '@/lib/sol-update'
import type { Sol } from '@/lib/types'

const base: Sol = {
  id: 's1', nom: 'Antre Nou', description: '', chefId: 'chef', chefNom: 'Chef',
  montant: 5000, devis: 'HTG', frequence: 'chak-mwa', maxManm: 3,
  dateDebut: '2026-05-01', status: 'aktif', peryòdAktif: 1, tirajFèt: true, createdAt: '2026-05-01',
  manm: [
    { entryId: 'e1', userId: 'u1', prenom: 'A', nom: 'A', telefon: '1', pozisyon: 1, rejwen: 'x' },
    { entryId: 'e2', userId: 'u2', prenom: 'B', nom: 'B', telefon: '2', pozisyon: 2, rejwen: 'x' },
  ],
}

describe('applySolUpdate', () => {
  it('ignores fields a chef must not change', () => {
    const r = applySolUpdate(base, { nom: 'Nouvo', montant: 1, chefId: 'hacker', id: 'x' })
    expect('sol' in r && r.sol).toMatchObject({ nom: 'Nouvo', montant: 5000, chefId: 'chef', id: 's1' })
  })
  it('re-orders hands but keeps their userId', () => {
    const r = applySolUpdate(base, { manm: [
      { entryId: 'e1', userId: 'hacker', prenom: 'A', nom: 'A', telefon: '1', pozisyon: 2 },
      { entryId: 'e2', prenom: 'B', nom: 'B', telefon: '2', pozisyon: 1 },
    ] })
    if (!('sol' in r)) throw new Error(r.error)
    expect(r.sol.manm.map(m => [m.userId, m.pozisyon])).toEqual([['u1', 2], ['u2', 1]])
  })
  it('refuses adding a hand through PUT', () => {
    const r = applySolUpdate(base, { manm: [
      ...base.manm,
      { entryId: 'e3', userId: 'u3', prenom: 'C', nom: 'C', telefon: '3', pozisyon: 3, rejwen: 'x' },
    ] })
    expect(r).toHaveProperty('error')
  })
  it('refuses two hands on the same position', () => {
    const r = applySolUpdate(base, { manm: base.manm.map(m => ({ ...m, pozisyon: 1 })) })
    expect(r).toHaveProperty('error')
  })
  it('refuses fewer places than members', () => {
    expect(applySolUpdate(base, { maxManm: 1 })).toHaveProperty('error')
  })
  it('refuses bad types', () => {
    expect(applySolUpdate(base, { status: 'piratage' })).toHaveProperty('error')
    expect(applySolUpdate(base, { maxManm: '3' })).toHaveProperty('error')
  })
})
