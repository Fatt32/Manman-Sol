import { z } from 'zod'
import type { Sol } from './types'

/* Fields a chef may change on an existing sol. Anything else in the
 * request body (id, chefId, montant, createdAt…) is ignored. */
const manmEdit = z.object({
  entryId:  z.string().min(1),
  prenom:   z.string().trim().min(1).max(80),
  nom:      z.string().trim().max(80),
  telefon:  z.string().trim().max(30),
  pozisyon: z.number().int().min(0),
})

export const solUpdateSchema = z.object({
  nom:         z.string().trim().min(1).max(100),
  description: z.string().max(1000),
  dateDebut:   z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  dateFin:     z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  frequence:   z.enum(['chak-semèn', 'de-semèn', 'chak-mwa', '3-mwa', '6-mwa', 'ane']),
  devis:       z.enum(['HTG', 'USD']),
  status:      z.enum(['annatant', 'aktif', 'konplè', 'rete']),
  maxManm:     z.number().int().min(1).max(500),
  peryòdAktif: z.number().int().min(1),
  tirajFèt:    z.boolean(),
  manm:        z.array(manmEdit),
}).partial()

export type SolUpdate = z.infer<typeof solUpdateSchema>

/** Returns the updated sol, or an error message in Kreyòl. Pure: does not touch the database. */
export function applySolUpdate(sol: Sol, body: unknown): { sol: Sol } | { error: string } {
  const parsed = solUpdateSchema.safeParse(body)
  if (!parsed.success) {
    const f = parsed.error.issues[0]
    return { error: `Done pa valid: ${f?.path.join('.') || 'kò rekèt la'}` }
  }
  const u = parsed.data
  const next: Sol = { ...sol }

  if (u.nom !== undefined)         next.nom = u.nom
  if (u.description !== undefined) next.description = u.description
  if (u.dateDebut !== undefined)   next.dateDebut = u.dateDebut
  if (u.dateFin !== undefined)     next.dateFin = u.dateFin
  if (u.frequence !== undefined)   next.frequence = u.frequence
  if (u.devis !== undefined)       next.devis = u.devis
  if (u.status !== undefined)      next.status = u.status
  if (u.tirajFèt !== undefined)    next.tirajFèt = u.tirajFèt

  if (u.manm !== undefined) {
    /* Edits and re-ordering only: adding or removing hands goes through /manm */
    const current = new Map(sol.manm.map(m => [m.entryId, m]))
    if (u.manm.length !== sol.manm.length || u.manm.some(m => !current.has(m.entryId)))
      return { error: 'Lis manm nan pa koresponn ak sol la' }
    const taken = u.manm.map(m => m.pozisyon).filter(p => p > 0)
    if (new Set(taken).size !== taken.length)
      return { error: 'De manm pa ka gen menm plas' }
    next.manm = u.manm.map(m => ({
      ...current.get(m.entryId)!,           /* keeps userId and rejwen */
      prenom: m.prenom, nom: m.nom, telefon: m.telefon, pozisyon: m.pozisyon,
    }))
  }

  if (u.maxManm !== undefined) {
    if (u.maxManm < next.manm.length)
      return { error: `Sol la gen ${next.manm.length} manm deja` }
    next.maxManm = u.maxManm
  }
  if (u.peryòdAktif !== undefined) {
    if (u.peryòdAktif > Math.max(next.maxManm, next.manm.length))
      return { error: 'Peryòd la pi gran pase kantite plas yo' }
    next.peryòdAktif = u.peryòdAktif
  }

  return { sol: next }
}
