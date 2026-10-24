'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, PlusCircle, Coins, Users, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCookie, AUTH_COOKIE, fmtMontan, fmtFrequence } from '@/lib/utils'
import type { Sol } from '@/lib/types'

const COLORS = ['#FF3DA0','#A855F7','#38BDF8','#34D399','#FCD34D','#FB923C']

function StatusBadge({ status }: { status: Sol['status'] }) {
  const map = {
    aktif:    { label:'Aktif',    color:'#34D399' },
    konplè:   { label:'Konplè',   color:'#38BDF8' },
    annatant: { label:'Annatant', color:'#FCD34D' },
    rete:     { label:'Rete',     color:'#FB923C' },
  }
  const { label, color } = map[status]
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ color, background:`${color}18`, border:`1px solid ${color}33` }}>
      {label}
    </span>
  )
}

export default function SolListPage() {
  const { user, loading } = useAuth()
  const [sols, setSols]   = useState<Sol[]>([])
  const [q, setQ]         = useState('')
  const [filter, setFilter] = useState<'tout'|'aktif'|'annatant'|'konplè'>('tout')

  useEffect(() => {
    const token = getCookie(AUTH_COOKIE)
    if (!token) return
    fetch('/api/sol')
      .then(r => r.json()).then(d => setSols(d.sols || []))
  }, [])

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid rgba(168,85,247,.2)', borderTopColor:'#A855F7', animation:'spin-slow 1s linear infinite' }} />
    </div>
  )

  const filtered = sols
    .filter(s => filter === 'tout' || s.status === filter)
    .filter(s => s.nom.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-5 max-w-md lg:max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Sol Yo</h1>
          <p className="text-white/50 text-xs">{sols.length} sol total</p>
        </div>
        {(user.role === 'admin' || user.role === 'chef') && (
          <Link href="/sol/kreye" className="candy-btn px-4 py-2.5 text-white font-bold text-sm rounded-full flex items-center gap-1.5" style={{ textDecoration:'none' }}>
            <PlusCircle size={16} /> Kreye
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/8">
        <Search size={16} className="text-white/40" />
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Chèche sol…"
          className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['tout','aktif','annatant','konplè'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
            style={filter === f
              ? { background:'rgba(168,85,247,.25)', color:'#C084FC', border:'1px solid rgba(168,85,247,.4)' }
              : { background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.4)', border:'1px solid rgba(255,255,255,.08)' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Sol cards */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/8">
          <div className="text-5xl mb-3">💰</div>
          <p className="text-white/50 text-sm">Pa gen sol nan kategori sa a.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sol, i) => {
            const pct = sol.maxManm > 0 ? (sol.manm.length / sol.maxManm) * 100 : 0
            const color = COLORS[i % COLORS.length]
            return (
              <motion.div key={sol.id}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i*.06, duration:.3 }}>
                <Link href={`/sol/${sol.id}`}
                  className="glass rounded-2xl overflow-hidden border border-white/8 hover:border-purple-500/30 transition-all block card-shine relative"
                  style={{ textDecoration:'none' }}>
                  {/* Color accent top */}
                  <div style={{ height:3, background:`linear-gradient(90deg, ${color}, ${COLORS[(i+1)%COLORS.length]})` }} />

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div style={{
                          width:44, height:44, borderRadius:14, flexShrink:0,
                          background:`linear-gradient(135deg, ${color}, ${COLORS[(i+1)%COLORS.length]})`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          boxShadow:`0 4px 16px ${color}44`,
                        }}>
                          <span style={{ fontSize:22 }}>💰</span>
                        </div>
                        <div>
                          <div className="text-white font-bold text-base leading-tight">{sol.nom}</div>
                          <div className="text-white/50 text-xs">pa {sol.chefNom}</div>
                        </div>
                      </div>
                      <StatusBadge status={sol.status} />
                    </div>

                    {/* Info row */}
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className="flex items-center gap-1"><Coins size={12} />{fmtMontan(sol.montant, sol.devis)}/peryòd</span>
                      <span className="flex items-center gap-1"><Users size={12} />{sol.manm.length}/{sol.maxManm}</span>
                      <span>{fmtFrequence(sol.frequence)}</span>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-white/40 mb-1">
                        <span>Manm</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/8">
                        <div className="h-full rounded-full transition-all"
                          style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${color}, ${COLORS[(i+1)%COLORS.length]})` }} />
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" />
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
