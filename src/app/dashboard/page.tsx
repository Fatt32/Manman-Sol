'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Coins, Users, TrendingUp, Clock, ChevronRight, PlusCircle, Crown, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCookie, fmtMontan, fmtDate, pwochènDatePeman } from '@/lib/utils'
import type { Sol, Peman, ToucheRecord } from '@/lib/types'

const COLORS = ['#FF3DA0','#A855F7','#38BDF8','#34D399','#FCD34D','#FB923C']

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [data, setData]   = useState<{
    aktif:number; konplè:number; annatant:number; totalSols:number; totalKolekte:number;
    mySols: Sol[];
  } | null>(null)

  useEffect(() => {
    const token = getCookie('sol_token')
    if (!token) return
    fetch('/api/dashboard', { headers: { Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(setData)
  }, [])

  if (loading || !user) return <Loader />

  const isAdmin = user.role === 'admin' || user.role === 'chef'
  const greet   = new Date().getHours() < 12 ? 'Bonjou' : 'Bonswa'

  return (
    <div className="space-y-6 max-w-md lg:max-w-5xl mx-auto">

      {/* Greeting */}
      <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}>
        <p className="text-white/50 text-sm">{greet} 👋</p>
        <h1 className="text-2xl font-black text-white">{user.prenom} {user.nom}</h1>
        <p className="text-white/30 text-xs capitalize">{user.role === 'admin' ? '👑 Manman Sol (Admin)' : user.role === 'chef' ? '⭐ Chef Sol' : '👤 Manm'}</p>
      </motion.div>

      {isAdmin ? <AdminView data={data} /> : <ManmView user={user} sols={data?.mySols ?? []} />}
    </div>
  )
}

/* ── Admin view ────────────────────────────────────────────────────────── */
function AdminView({ data }: { data: { aktif:number; konplè:number; totalSols:number; totalKolekte:number; mySols:Sol[] } | null }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon:Coins,      label:'Sol Aktif',    value:data?.aktif ?? '—',   color:'#A855F7' },
          { icon:TrendingUp, label:'Total Kolekte', value:data ? fmtMontan(data.totalKolekte) : '—', color:'#34D399' },
          { icon:Users,      label:'Total Sol',    value:data?.totalSols ?? '—', color:'#38BDF8' },
          { icon:Clock,      label:'Konplè',       value:data?.konplè ?? '—',  color:'#FCD34D' },
        ].map(({ icon:Icon, label, value, color }, i) => (
          <motion.div key={label}
            initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }}
            transition={{ delay:i*.07 }}
            className="glass rounded-2xl p-4 card-shine relative overflow-hidden"
            style={{ border:`1px solid ${color}22` }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:70, height:70, borderRadius:'50%', background:`radial-gradient(circle, ${color}22 0%, transparent 70%)` }} />
            <div style={{ width:36, height:36, borderRadius:10, marginBottom:8, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${color}33` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="font-black text-xl text-white">{value}</div>
            <div className="text-white/50 text-xs mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white/80 text-sm uppercase tracking-wider">Sol Yo</h2>
        <Link href="/sol/kreye" className="flex items-center gap-1 text-xs text-purple-400 font-semibold hover:text-purple-300">
          <PlusCircle size={14} /> Kreye
        </Link>
      </div>

      {!data?.mySols?.length ? (
        <div className="glass rounded-2xl p-8 text-center border border-white/8">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-white/50 text-sm">Pa gen sol pou kounyela.</p>
          <Link href="/sol/kreye" className="inline-block mt-4 candy-btn px-6 py-2.5 text-white font-bold text-sm rounded-full" style={{ textDecoration:'none' }}>
            Kreye Premye Sol Ou
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {data.mySols.map((sol, i) => (
            <Link key={sol.id} href={`/sol/${sol.id}`}
              className="glass rounded-2xl p-3.5 flex items-center gap-3 border border-white/8 hover:border-purple-500/30 transition-all block" style={{ textDecoration:'none' }}>
              <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background:`linear-gradient(135deg,${COLORS[i%COLORS.length]},${COLORS[(i+1)%COLORS.length]})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 12px ${COLORS[i%COLORS.length]}44` }}>
                <span style={{ fontSize:20 }}>💰</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm truncate">{sol.nom}</div>
                <div className="text-white/50 text-xs">{sol.manm.length}/{sol.maxManm} manm • {fmtMontan(sol.montant, sol.devis)}/peryòd</div>
              </div>
              <StatusBadge status={sol.status} />
              <ChevronRight size={16} className="text-white/30" />
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

/* ── Member view (PRIVATE — no other names shown) ───────────────────────── */
function ManmView({ user, sols }: { user: { id:string; prenom:string; nom:string }, sols: Sol[] }) {
  const token = getCookie('sol_token')

  return (
    <>
      {sols.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/8">
          <div className="text-5xl mb-3">💰</div>
          <p className="text-white/50 text-sm">Ou poko nan okenn sol.</p>
          <p className="text-white/30 text-xs mt-2">Kontakte Manman Sol ou pou yo ajoute ou.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sols.map((sol, i) => (
            <SolCardManm key={sol.id} sol={sol} userId={user.id} token={token || ''} idx={i} />
          ))}
        </div>
      )}
    </>
  )
}

function SolCardManm({ sol, userId, token, idx }: { sol:Sol; userId:string; token:string; idx:number }) {
  const mySlots = sol.manm.filter(m => m.userId === userId)
  const [peman,  setPeman]  = useState<Peman[]>([])
  const [touche, setTouche] = useState<ToucheRecord[]>([])
  const [acting, setActing] = useState(false)
  const [msg,    setMsg]    = useState('')

  const h = { Authorization:`Bearer ${token}` }

  const loadTouche = useCallback(() => {
    fetch(`/api/sol/${sol.id}/touche`, { headers: { Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTouche((d.records || []).filter((r: ToucheRecord) => r.userId === userId)))
  }, [sol.id, userId, token])

  useEffect(() => {
    fetch(`/api/sol/${sol.id}/peman`, { headers: h })
      .then(r => r.json())
      .then(d => setPeman((d.peman || []).filter((p: Peman) => p.userId === userId)))
    loadTouche()
  }, [sol.id, userId, token, loadTouche])

  /* Refetch touche when the tab regains focus (e.g. admin just confirmed) */
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadTouche() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadTouche])

  if (mySlots.length === 0) return null

  const color      = COLORS[idx % COLORS.length]
  const nextColor  = COLORS[(idx + 1) % COLORS.length]
  const totalPaid  = peman.filter(p => p.status === 'peye').reduce((s,p) => s + p.montan, 0)
  const sak        = sol.montant * sol.manm.length

  function calcDate(pozisyon: number) {
    return pwochènDatePeman(sol.dateDebut, pozisyon, sol.frequence)
  }

  async function action(type: 'konfime' | 'demande', pozisyon: number) {
    setActing(true); setMsg('')
    try {
      const res = await fetch(`/api/sol/${sol.id}/touche`, {
        method:'POST',
        headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ action: type, peryòd: pozisyon }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg(type === 'konfime' ? '✅ Konfime avèk siksè!' : '📨 Demann voye bay Manman Sol!')
        /* Optimistic update — immediately reflect new status */
        if (data.record) {
          setTouche(prev => {
            const without = prev.filter(r => r.peryòd !== pozisyon)
            return [...without, data.record]
          })
        } else {
          loadTouche()
        }
      } else {
        setMsg(data.error || 'Erè')
      }
    } catch { setMsg('Erè rezo') }
    finally { setActing(false) }
  }

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx*.08 }}
      className="glass rounded-2xl overflow-hidden border" style={{ borderColor:`${color}22` }}>
      <div style={{ height:3, background:`linear-gradient(90deg,${color},${nextColor})` }} />
      <div className="p-4 space-y-4">

        {/* Sol name */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-white font-black text-base truncate">{sol.nom}</h3>
            <p className="text-white/40 text-xs">{sol.manm.length} manm • {fmtMontan(sol.montant, sol.devis)}/peryòd</p>
          </div>
          {mySlots.length > 1 && (
            <span className="glass px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ color, border:`1px solid ${color}44` }}>
              {mySlots.length} plas
            </span>
          )}
        </div>

        {/* Payment summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass rounded-xl p-2.5 text-center border border-white/8">
            <div className="text-white font-bold text-sm">{fmtMontan(totalPaid, sol.devis)}</div>
            <div className="text-white/40 text-xs">Ou Peye</div>
          </div>
          <div className="glass rounded-xl p-2.5 text-center border border-white/8">
            <div className="text-white font-bold text-sm">{fmtMontan(sak, sol.devis)}</div>
            <div className="text-white/40 text-xs">Sak Total</div>
          </div>
        </div>

        {/* One row per slot */}
        {mySlots.map(slot => {
          if (slot.pozisyon === 0) return (
            <div key={slot.entryId} className="glass rounded-xl p-3 flex items-center gap-3 border border-white/8">
              <div style={{ width:32, height:32, borderRadius:10, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:'bold', color, flexShrink:0 }}>?</div>
              <span className="text-white/40 text-xs">Tiraj annatant pou plas sa a</span>
            </div>
          )

          const tRec        = touche.find(r => r.peryòd === slot.pozisyon)
          const isCurrent   = slot.pozisyon === sol.peryòdAktif
          const isPast      = slot.pozisyon < sol.peryòdAktif
          const konfime     = tRec?.status === 'konfime'
          const demande     = tRec?.status === 'demande'
          const avantMwen   = sol.manm.filter(m => m.pozisyon > 0 && m.pozisyon < slot.pozisyon).length
          const turnDate    = calcDate(slot.pozisyon)

          return (
            <div key={slot.entryId} className="space-y-2">
              {/* Slot header */}
              <div className="flex items-center gap-3">
                <div style={{ width:40, height:40, borderRadius:12, background: konfime ? 'linear-gradient(135deg,#38BDF8,#0EA5E9)' : `linear-gradient(135deg,${color},${nextColor})`, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', flexShrink:0, boxShadow: isCurrent ? `0 4px 16px ${color}55` : 'none' }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,.7)', fontWeight:600 }}>Pos.</span>
                  <span style={{ fontSize:15, fontWeight:'bold', color:'white', lineHeight:1 }}>{konfime ? '✓' : slot.pozisyon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {konfime ? (
                    <p className="text-blue-400 font-bold text-sm">Ou deja touche sak sa a ✅</p>
                  ) : isPast ? (
                    <p className="text-white/40 text-sm">Peryòd #{slot.pozisyon} pase — pa konfime</p>
                  ) : isCurrent ? (
                    <p className="text-yellow-400 font-bold text-sm">👑 Kounyea se tur ou!</p>
                  ) : (
                    <p className="text-white/70 text-sm">{avantMwen} moun avan ou</p>
                  )}
                  <p className="text-white/30 text-xs">{fmtDate(turnDate.toISOString())}</p>
                </div>
                {demande && !konfime && (
                  <span className="glass px-2 py-1 rounded-full text-xs font-bold" style={{ color:'#FB923C', border:'1px solid #FB923C44' }}>Mande</span>
                )}
              </div>

              {/* Action buttons for current period */}
              {isCurrent && !konfime && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => action('konfime', slot.pozisyon)} disabled={acting}
                    className="candy-btn-green py-2.5 text-white font-bold text-xs rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <CheckCircle size={14}/> Mwen Touche!
                  </button>
                  <button onClick={() => action('demande', slot.pozisyon)} disabled={acting || demande}
                    className="candy-btn-pink py-2.5 text-white font-bold text-xs rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <AlertCircle size={14}/> Mande Peman
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {msg && <p className={`text-xs text-center font-semibold ${msg.startsWith('✅') || msg.startsWith('📨') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}

        <Link href={`/sol/${sol.id}`} className="block text-center text-purple-400 text-xs font-semibold hover:text-purple-300 py-1">
          Wè detay sol la →
        </Link>
      </div>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string,{label:string;color:string}> = { aktif:{label:'Aktif',color:'#34D399'}, konplè:{label:'Konplè',color:'#38BDF8'}, annatant:{label:'Annatant',color:'#FCD34D'}, rete:{label:'Rete',color:'#FB923C'} }
  const { label, color } = map[status] ?? { label:status, color:'#A855F7' }
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ color, background:`${color}18`, border:`1px solid ${color}33` }}>{label}</span>
}

function Loader() {
  return <div className="flex items-center justify-center min-h-[60vh]"><div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid rgba(168,85,247,.2)', borderTopColor:'#A855F7', animation:'spin-slow 1s linear infinite' }} /></div>
}
