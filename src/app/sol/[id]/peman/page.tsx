'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, Clock, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCookie, fmtMontan, fmtDate, fmtPeryod, getInitials } from '@/lib/utils'
import type { Sol, Peman, SolManm } from '@/lib/types'

const COLORS = ['#FF3DA0','#A855F7','#38BDF8','#34D399','#FCD34D','#FB923C']
const METOD = ['cash','moncash','natcash','lajan-men'] as const

export default function PemanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, loading } = useAuth()
  const [sol, setSol]       = useState<Sol | null>(null)
  const [peman, setPeman]   = useState<Peman[]>([])
  const [peryòd, setPeryòd] = useState(1)
  const [showForm, setShowForm] = useState<string | null>(null) // entryId
  const [metòd, setMetòd]   = useState<typeof METOD[number]>('cash')
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)
  const [stats, setStats]   = useState({ paid: 0, total: 0, amount: 0 })

  const token = getCookie('sol_token')
  const h = { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' }

  function load() {
    if (!token) return
    fetch(`/api/sol/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.sol) { setSol(d.sol); setPeryòd(d.sol.peryòdAktif) } })
    fetch(`/api/sol/${id}/peman`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setPeman(d.peman || []))
  }

  useEffect(() => { load() }, [id, token])

  useEffect(() => {
    if (!sol) return
    const p = peman.filter(x => x.peryòd === peryòd)
    setStats({ paid: p.filter(x => x.status === 'peye').length, total: sol.manm.length, amount: p.reduce((s,x) => s+x.montan, 0) })
  }, [peman, peryòd, sol])

  async function markPaid(manm: SolManm) {
    setSaving(true)
    const res = await fetch(`/api/sol/${id}/peman`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ userId: manm.userId, peryòd, metòd, note }),
    })
    if (res.ok) { setShowForm(null); setNote(''); load() }
    setSaving(false)
  }

  if (loading || !user || !sol) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid rgba(168,85,247,.2)', borderTopColor:'#A855F7', animation:'spin-slow 1s linear infinite' }} />
    </div>
  )

  const isChef = sol.chefId === user.id || user.role === 'admin'
  const maxPeryòd = sol.maxManm
  const paidIds = new Set(peman.filter(p => p.peryòd === peryòd && p.status === 'peye').map(p => p.userId))

  /* Deduplicate members by userId — payment is per person, not per slot */
  const uniqueManm = (() => {
    const seen = new Set<string>()
    return sol.manm.filter(m => { if (seen.has(m.userId)) return false; seen.add(m.userId); return true })
  })()

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/sol/${id}`} className="glass p-2 rounded-xl text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Peman</h1>
          <p className="text-white/40 text-xs">{sol.nom}</p>
        </div>
      </div>

      {/* Stats */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        className="glass rounded-2xl p-4 border border-white/8 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-white/50 text-sm">{fmtPeryod(sol.dateDebut, sol.frequence, peryòd)}</p>
          <div className="text-xl font-black" style={{ color:'#34D399' }}>{fmtMontan(stats.amount, sol.devis)}</div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>{stats.paid}/{stats.total} moun peye</span>
            <span>{stats.total > 0 ? Math.round((stats.paid/stats.total)*100) : 0}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/8">
            <motion.div className="h-full rounded-full"
              animate={{ width: `${stats.total > 0 ? (stats.paid/stats.total)*100 : 0}%` }}
              transition={{ duration:.5 }}
              style={{ background:'linear-gradient(90deg,#34D399,#38BDF8)' }} />
          </div>
        </div>
      </motion.div>

      {/* Period selector */}
      <div className="flex items-center justify-between glass rounded-2xl p-3 border border-white/8">
        <button onClick={() => setPeryòd(p => Math.max(1,p-1))} disabled={peryòd===1}
          className="p-2 rounded-xl glass border border-white/8 disabled:opacity-30 text-white/70 hover:text-white transition-colors">
          <ChevronDown size={18} />
        </button>
        <div className="text-center">
          <div className="text-white font-black text-base leading-tight">{fmtPeryod(sol.dateDebut, sol.frequence, peryòd)}</div>
          <div className="text-white/40 text-xs">{peman.filter(p => p.peryòd===peryòd && p.status==='peye').length} peye</div>
        </div>
        <button onClick={() => setPeryòd(p => Math.min(maxPeryòd,p+1))} disabled={peryòd===maxPeryòd}
          className="p-2 rounded-xl glass border border-white/8 disabled:opacity-30 text-white/70 hover:text-white transition-colors">
          <ChevronUp size={18} />
        </button>
      </div>

      {/* Members payment list */}
      <div className="space-y-2">
        {uniqueManm.map((m, i) => {
          const paid = paidIds.has(m.userId)
          const pemanRecord = peman.find(p => p.userId === m.userId && p.peryòd === peryòd)
          const color = COLORS[i % COLORS.length]

          return (
            <motion.div key={m.entryId} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}>
              <div className={`glass rounded-2xl border transition-all ${paid ? 'border-green-500/30' : 'border-white/8'}`}>
                <div className="p-3.5 flex items-center gap-3">
                  {/* Avatar */}
                  <div style={{
                    width:40, height:40, borderRadius:'50%', flexShrink:0,
                    background: paid ? 'linear-gradient(135deg,#34D399,#059669)' : `linear-gradient(135deg,${color},${COLORS[(i+1)%COLORS.length]})`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, fontWeight:'bold', color:'white',
                    opacity: paid ? 1 : .85,
                  }}>
                    {paid ? '✓' : getInitials(m.prenom, m.nom)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{m.prenom} {m.nom}</div>
                    {pemanRecord
                      ? <div className="text-white/40 text-xs">{fmtDate(pemanRecord.datePeman)} • {pemanRecord.metòd}</div>
                      : <div className="text-white/30 text-xs">Poko peye</div>
                    }
                  </div>

                  <div className="flex items-center gap-2">
                    {paid
                      ? <CheckCircle size={20} style={{ color:'#34D399', filter:'drop-shadow(0 0 6px rgba(52,211,153,.6))' }} />
                      : <Clock size={20} style={{ color:'#FCD34D', opacity:.7 }} />
                    }
                    {isChef && !paid && (
                      <button onClick={() => setShowForm(showForm === m.entryId ? null : m.entryId)}
                        className="candy-btn-green p-2 rounded-xl text-white">
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment form */}
                <AnimatePresence>
                  {showForm === m.entryId && (
                    <motion.div
                      initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }} transition={{ duration:.25 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 pt-2 border-t border-white/8 space-y-3">
                        <p className="text-white/50 text-xs font-bold uppercase">Metòd Peman</p>
                        <div className="grid grid-cols-4 gap-2">
                          {METOD.map(met => (
                            <button key={met} onClick={() => setMetòd(met)}
                              className="py-2 rounded-xl text-xs font-bold transition-all border"
                              style={metòd===met
                                ? { background:'rgba(52,211,153,.2)', borderColor:'rgba(52,211,153,.5)', color:'#34D399' }
                                : { background:'rgba(255,255,255,.05)', borderColor:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.5)' }}>
                              {met}
                            </button>
                          ))}
                        </div>
                        <div className="glass rounded-xl px-3 py-2 border border-white/8">
                          <input value={note} onChange={e => setNote(e.target.value)}
                            placeholder="Nòt (opsyonèl)"
                            className="w-full bg-transparent text-white/80 placeholder-white/30 outline-none text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setShowForm(null)} className="glass px-4 py-2.5 rounded-xl text-white/50 text-sm border border-white/8">
                            <X size={14} />
                          </button>
                          <button onClick={() => markPaid(m)} disabled={saving}
                            className="flex-1 candy-btn-green py-2.5 text-white font-bold text-sm rounded-xl disabled:opacity-60">
                            {saving ? 'Ap anrejistre…' : `✓ Konfime ${fmtMontan(sol.montant, sol.devis)}`}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
