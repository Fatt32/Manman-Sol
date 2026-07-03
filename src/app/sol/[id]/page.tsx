'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Users, Shuffle, CreditCard, Crown, ChevronLeft, ChevronRight,
  CheckCircle, Clock, AlertCircle, BadgeCheck, Bell, X, Settings,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCookie, fmtMontan, fmtFrequence, fmtDate, fmtPeryod, getInitials, getPeryodKouran, pwochènDatePeman, dateLimitPeryod } from '@/lib/utils'
import type { Sol, Peman, ToucheRecord, SolManm } from '@/lib/types'

const COLORS = ['#FF3DA0','#A855F7','#38BDF8','#34D399','#FCD34D','#FB923C']
const METOD  = ['cash','moncash','natcash','lajan-men'] as const

export default function SolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, loading } = useAuth()
  const [sol, setSol]     = useState<Sol | null>(null)
  const [peman, setPeman] = useState<Peman[]>([])
  const [touche, setTouche] = useState<ToucheRecord[]>([])
  const [stats, setStats] = useState<{
    totalKolekte:number; pwosentPeye:number;
    pwochènTouche: { prenom:string; nom:string; peryòd:number } | null; devis:string
  } | null>(null)
  const [tab, setTab] = useState<'overview'|'manm'>('overview')
  const [viewPeryod, setViewPeryod] = useState<number | null>(null)
  const [toucheFormOpen, setToucheFormOpen] = useState(false)
  const [toucheMetod, setToucheMetod] = useState<typeof METOD[number]>('cash')
  const [toucheNote, setToucheNote]   = useState('')
  const [toucheSaving, setToucheSaving] = useState(false)
  const [toucheMsg, setToucheMsg]     = useState<string | null>(null)

  const refetchData = () => {
    const token = getCookie('sol_token')
    if (!token) return
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`/api/sol/${id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/sol/${id}/peman`, { headers: h }).then(r => r.json()),
      fetch(`/api/sol/${id}/stats`, { headers: h }).then(r => r.json()),
      fetch(`/api/sol/${id}/touche`, { headers: h }).then(r => r.json()),
    ]).then(([solD, pemanD, statsD, toucheD]) => {
      if (solD.sol)                setSol(solD.sol)
      if (pemanD.peman)            setPeman(pemanD.peman)
      if (statsD.pwosentPeye !== undefined) setStats(statsD)
      if (toucheD.records)         setTouche(toucheD.records)
    })
  }

  async function handleMarkPaid(userId: string, entryId: string, peryod: number) {
    const token = getCookie('sol_token')
    if (!token) return
    try {
      const res = await fetch(`/api/sol/${id}/peman`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, entryId, peryòd: peryod, metòd: 'cash', note: 'Marked paid from delay alerts' })
      })
      if (res.ok) {
        refetchData()
      } else {
        const err = await res.json()
        alert(`Erè: ${err.error || 'Erè nan anrejistreman peman'}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleConfirmPayout(userId: string, peryod: number) {
    const token = getCookie('sol_token')
    if (!token) return
    try {
      const res = await fetch(`/api/sol/${id}/touche`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'admin-konfime', peryòd: peryod, userId, metòd: 'cash', note: 'Marked payout from delay alerts' })
      })
      if (res.ok) {
        refetchData()
      } else {
        const err = await res.json()
        alert(`Erè: ${err.error || 'Erè nan anrejistreman peman'}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    refetchData()
  }, [id])

  if (loading || !user) return <Loader />
  if (!sol) return <Loader />

  const isChef     = sol.chefId === user.id || user.role === 'admin'
  const sortedManm = [...sol.manm].sort((a,b) => (a.pozisyon||999) - (b.pozisyon||999))
  const pct        = sol.maxManm > 0 ? Math.round((sol.manm.length / sol.maxManm) * 100) : 0

  // Helper to check if a specific member slot has paid for a specific period
  const isSlotPaid = (m: SolManm, p: number) => {
    const userSlots = sol.manm.filter(x => x.userId === m.userId)
    const slotIndex = userSlots.findIndex(x => x.entryId === m.entryId)
    const userPayments = peman.filter(pm => pm.userId === m.userId && pm.peryòd === p && pm.status === 'peye')
    
    const hasExplicit = userPayments.some(pm => pm.entryId === m.entryId)
    if (hasExplicit) return true

    return userPayments.length > slotIndex
  }

  const getManmName = (m: SolManm) => {
    const matches = sol.manm.filter(x => x.userId === m.userId)
    if (matches.length > 1) {
      const idx = matches.findIndex(x => x.entryId === m.entryId)
      return `${m.prenom} ${m.nom} (Men #${idx + 1})`
    }
    return `${m.prenom} ${m.nom}`
  }

  /* Map pozisyon → touche status */
  const toucheByPoz = new Map<number, ToucheRecord['status']>()
  touche.forEach(r => { if (r.peryòd > 0) toucheByPoz.set(r.peryòd, r.status) })

  const peryodKouran = getPeryodKouran(sol.dateDebut, sol.frequence, sol.manm.length || sol.maxManm)
  const unpaidManm = sol.manm.filter(m => !isSlotPaid(m, peryodKouran))

  const activePayoutPeriod = (() => {
    if (!sol.tirajFèt || sol.manm.length === 0) return 1
    for (let p = 1; p <= sol.manm.length; p++) {
      const recipient = sol.manm.find(m => m.pozisyon === p)
      if (recipient) {
        const isPaid = touche.some(r => r.peryòd === p && r.status === 'konfime' && r.userId === recipient.userId)
        if (!isPaid) return p
      }
    }
    return sol.manm.length || 1
  })()

  const currentManmForPeriod = sol.manm.find(m => m.pozisyon === activePayoutPeriod)
  const currentTouche        = touche.find(r => r.peryòd === activePayoutPeriod && r.userId === currentManmForPeriod?.userId)
  const totalSakPeryod       = sol.montant * sol.manm.length
  const myTurn               = currentManmForPeriod?.userId === user.id && !isChef
  const toucheKonfime        = currentTouche?.status === 'konfime'
  const toucheDemande        = currentTouche?.status === 'demande'
  const solTooNew            = (Date.now() - new Date(sol.createdAt).getTime()) < 24 * 60 * 60 * 1000

  const checkReta = () => {
    if (!sol.tirajFèt || sol.manm.length === 0) return { retaPeman: [], retaTouche: [] }

    const jodia = new Date()
    jodia.setHours(0, 0, 0, 0)

    const retaPeman: { peryod: number; dateLimit: Date; manm: typeof sol.manm }[] = []
    const retaTouche: { peryod: number; dateLimit: Date; recipient: typeof sol.manm[number] }[] = []

    for (let p = 1; p <= sol.manm.length; p++) {
      const deadline = dateLimitPeryod(sol.dateDebut, p, sol.frequence)
      deadline.setHours(23, 59, 59, 999)

      // Only flag as late if the deadline has passed (month is over)
      if (jodia > deadline) {
        const unpaidForP = sol.manm.filter(m => !isSlotPaid(m, p))
        if (unpaidForP.length > 0) {
          retaPeman.push({ peryod: p, dateLimit: deadline, manm: unpaidForP })
        }

        const payoutReceived = touche.some(r => r.peryòd === p && r.status === 'konfime')
        if (!payoutReceived) {
          const recipient = sol.manm.find(m => m.pozisyon === p)
          if (recipient) {
            retaTouche.push({ peryod: p, dateLimit: deadline, recipient })
          }
        }
      }
    }

    return { retaPeman, retaTouche }
  }

  const { retaPeman, retaTouche } = checkReta()

  const confirmedPayouts = touche
    .filter(r => {
      const recipient = sol.manm.find(m => m.pozisyon === r.peryòd)
      return r.status === 'konfime' && recipient && r.userId === recipient.userId
    })
    .map(r => {
      const recipient = sol.manm.find(m => m.pozisyon === r.peryòd)
      return { ...r, recipient }
    })
    .sort((a, b) => {
      const timeA = a.dateKonfime ? new Date(a.dateKonfime).getTime() : 0
      const timeB = b.dateKonfime ? new Date(b.dateKonfime).getTime() : 0
      return timeB - timeA || b.peryòd - a.peryòd
    })

  const dynamicNextRecipient = (() => {
    if (!sol.tirajFèt || sol.manm.length === 0) return null
    for (let p = 1; p <= sol.manm.length; p++) {
      const recipient = sol.manm.find(m => m.pozisyon === p)
      const isPaid = recipient && touche.some(r => r.peryòd === p && r.status === 'konfime' && r.userId === recipient.userId)
      if (!isPaid && recipient) {
        const pDate = pwochènDatePeman(sol.dateDebut, p, sol.frequence)
        return { recipient, peryod: p, date: pDate }
      }
    }
    return null
  })()

  const getMonthName = (date: Date) => {
    const MWA_LONG = ['Janvye','Fevriye','Mas','Avril','Me','Jen','Jiyè','Out','Septanm','Oktòb','Novanm','Desanm']
    return `${MWA_LONG[date.getMonth()]} ${date.getFullYear()}`
  }

  const getRetaDaysText = (dateLimit: Date) => {
    const diffTime = Date.now() - dateLimit.getTime()
    if (diffTime <= 0) return ''
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return ' (Jodi a)'
    return ` (${diffDays} ${diffDays === 1 ? 'jou' : 'jou'} reta)`
  }

  async function konfimeTouche(targetUserId: string, peryod: number) {
    setToucheSaving(true)
    const token = getCookie('sol_token')
    const action = isChef ? 'admin-konfime' : 'konfime'
    try {
      const res = await fetch(`/api/sol/${id}/touche`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, peryòd: peryod, userId: targetUserId, metòd: toucheMetod, note: toucheNote }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToucheMsg(`❌ ${data.error || 'Erè'}`)
        setTimeout(() => setToucheMsg(null), 4000)
        return
      }
      /* Reload touche records from server to guarantee UI reflects saved state */
      const freshRes = await fetch(`/api/sol/${id}/touche`, { headers: { Authorization: `Bearer ${token}` } })
      const freshData = await freshRes.json()
      if (freshData.records) setTouche(freshData.records)

      setToucheFormOpen(false)
      setToucheNote('')
      setToucheMsg(isChef ? '✅ Peman konfime! Tout manm yo notifye.' : '✅ Konfime avèk siksè!')
      setTimeout(() => setToucheMsg(null), 4000)
    } finally { setToucheSaving(false) }
  }

  /* ── Touche card JSX (shared between mobile flow and desktop left column) ── */
  const ToucheCard = sol.tirajFèt && currentManmForPeriod ? (
    <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
      className="glass rounded-2xl p-4 border space-y-3"
      style={{ borderColor: toucheKonfime ? 'rgba(56,189,248,.35)' : myTurn ? 'rgba(168,85,247,.35)' : 'rgba(252,211,77,.3)' }}>

      <div className="flex items-center gap-2">
        {toucheKonfime
          ? <CheckCircle size={16} style={{ color:'#38BDF8' }} />
          : <Crown size={16} style={{ color:'#FCD34D' }} />
        }
        <p className="font-bold text-sm" style={{ color: toucheKonfime ? '#38BDF8' : myTurn ? '#C084FC' : '#FCD34D' }}>
          {toucheKonfime ? 'Moun ki deja touche yo' : myTurn ? '🎉 Se tou pa w!' : 'Ki moun ki pral touche?'}
        </p>
        {!toucheKonfime && (
          <span className="ml-auto text-white/35 text-xs">{fmtPeryod(sol.dateDebut, sol.frequence, activePayoutPeriod)}</span>
        )}
        {toucheDemande && !toucheKonfime && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background:'rgba(251,146,60,.15)', color:'#FB923C', border:'1px solid rgba(251,146,60,.3)' }}>Mande</span>
        )}
      </div>

      {!toucheKonfime && (
        <div className="flex items-center gap-3">
          <div style={{
            width:52, height:52, borderRadius:14, flexShrink:0,
            background: myTurn ? 'linear-gradient(135deg,#A855F7,#7C3AED)' : 'linear-gradient(135deg,#FCD34D,#F59E0B)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize: 16, fontWeight:'bold', color:'white',
            boxShadow: myTurn ? '0 4px 16px rgba(168,85,247,.4)' : '0 4px 12px rgba(252,211,77,.3)',
          }}>
            {getInitials(currentManmForPeriod.prenom, currentManmForPeriod.nom)}
          </div>
          <div className="flex-1">
            <div className="text-white font-bold">{currentManmForPeriod.prenom} {currentManmForPeriod.nom}</div>
            <div className="text-white/40 text-xs">Pozisyon #{currentManmForPeriod.pozisyon}</div>
          </div>
          <div className="font-black text-xl" style={{ color: '#FCD34D' }}>
            {fmtMontan(totalSakPeryod, sol.devis)}
          </div>
        </div>
      )}

      {toucheMsg && (
        <div className="text-center text-sm font-semibold py-1"
          style={{ color: toucheMsg.startsWith('❌') ? '#F87171' : '#34D399' }}>
          {toucheMsg}
        </div>
      )}

      {/* Detail / Action Block: only show if current period is not confirmed */}
      {!toucheKonfime && (
        solTooNew && isChef ? (
          <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold"
            style={{ background:'rgba(251,146,60,.1)', border:'1px solid rgba(251,146,60,.25)', color:'#FB923C' }}>
            <AlertCircle size={14} />
            <span>Sol la fenk kreye. Tann 24 èdtan anvan premye peman.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {isChef && (
              toucheFormOpen ? (
                <div className="space-y-2 pt-2 border-t border-white/8">
                  <div className="grid grid-cols-2 gap-2">
                    {METOD.map(met => (
                      <button key={met} onClick={() => setToucheMetod(met)}
                        className="py-2 rounded-xl text-xs font-bold transition-all border"
                        style={toucheMetod === met
                          ? { background:'rgba(52,211,153,.2)', borderColor:'rgba(52,211,153,.5)', color:'#34D399' }
                          : { background:'rgba(255,255,255,.05)', borderColor:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.5)' }}>
                        {met}
                      </button>
                    ))}
                  </div>
                  <div className="glass rounded-xl px-3 py-2 border border-white/8">
                    <input value={toucheNote} onChange={e => setToucheNote(e.target.value)}
                      placeholder="Nòt (opsyonèl)"
                      className="w-full bg-transparent text-white/80 placeholder-white/30 outline-none text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setToucheFormOpen(false)}
                      className="glass px-4 py-2.5 rounded-xl text-white/50 border border-white/8">
                      <X size={14} />
                    </button>
                    <button onClick={() => konfimeTouche(currentManmForPeriod.userId, activePayoutPeriod)}
                      disabled={toucheSaving}
                      className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
                      style={{ background:'linear-gradient(135deg,#34D399,#059669)', boxShadow:'0 4px 12px rgba(52,211,153,.35)' }}>
                      {toucheSaving ? 'Ap konfime…' : `✓ Konfime ${fmtMontan(totalSakPeryod, sol.devis)}`}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setToucheFormOpen(true)}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm"
                  style={{ background:'linear-gradient(135deg,#34D399,#059669)', boxShadow:'0 4px 12px rgba(52,211,153,.35)' }}>
                  💰 Konfime Peman Touche
                </button>
              )
            )}
            {myTurn && (
              <button onClick={() => konfimeTouche(user.id, activePayoutPeriod)}
                disabled={toucheSaving}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60"
                style={{ background:'linear-gradient(135deg,#A855F7,#7C3AED)', boxShadow:'0 4px 12px rgba(168,85,247,.35)' }}>
                {toucheSaving ? 'Ap konfime…' : '✓ Mwen Touche Sak La'}
              </button>
            )}
          </div>
        )
      )}

      {/* History list: always show if there are confirmed payouts */}
      {confirmedPayouts.length > 0 && (
        <div className="space-y-2 mt-2 pt-2 border-t border-white/5">
          {toucheKonfime && (
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Moun ki deja touche yo:</p>
          )}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {confirmedPayouts.map((cp, i) => {
              const name = cp.recipient ? getManmName(cp.recipient) : 'Manm'
              const isLatestConfirmed = i === 0
              return (
                <div key={cp.id} className="flex items-center justify-between p-2.5 rounded-xl border text-[11px] transition-all"
                  style={{
                    background: isLatestConfirmed ? 'rgba(56,189,248,.08)' : 'rgba(255,255,255,.02)',
                    borderColor: isLatestConfirmed ? 'rgba(56,189,248,.2)' : 'rgba(255,255,255,.05)',
                    color: isLatestConfirmed ? '#38BDF8' : 'rgba(255,255,255,.35)',
                    opacity: isLatestConfirmed ? 1 : 0.6
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle size={11} style={{ color: '#38BDF8' }} />
                    <div className="truncate text-left">
                      <div className="font-semibold text-white">{name}</div>
                      {cp.dateKonfime && (
                        <div className="text-white/40 text-[9px] mt-0.5">
                          {fmtDate(cp.dateKonfime)}{cp.metòd ? ` • ${cp.metòd}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-bold flex-shrink-0">
                    <span>Peryòd {cp.peryòd}</span>
                    <span>{fmtMontan(totalSakPeryod, sol.devis)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  ) : null

  return (
    <div className="max-w-md lg:max-w-5xl mx-auto space-y-5">

      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link href="/sol" className="glass p-2 rounded-xl text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-white truncate">{sol.nom}</h1>
          <p className="text-white/40 text-xs">pa {sol.chefNom}</p>
        </div>
        <StatusBadge status={sol.status} />
      </div>

      {/* ── Desktop: two-column; Mobile: single column ── */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6 lg:items-start space-y-5 lg:space-y-0">

      {/* LEFT COLUMN (desktop) / top section (mobile) */}
      <div className="space-y-4">

      {/* Hero card */}
      <motion.div initial={{ opacity:0, scale:.96 }} animate={{ opacity:1, scale:1 }}
        className="glass rounded-3xl overflow-hidden card-depth relative"
        style={{ border:'1px solid rgba(168,85,247,.2)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#FF3DA0,#A855F7,#38BDF8)' }} />
        <div className="p-5 space-y-4">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs mb-1">Sak pa peryòd</p>
              <p className="text-3xl font-black gradient-text-gold">{fmtMontan(sol.montant * sol.manm.length, sol.devis)}</p>
              <p className="text-white/40 text-xs">{sol.manm.length} × {fmtMontan(sol.montant, sol.devis)}</p>
            </div>
            <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#FF3DA0,#A855F7)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(168,85,247,.5)' }}>
              <span style={{ fontSize:32 }}>💰</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label:'Frekans', value: fmtFrequence(sol.frequence) },
              { label:'Manm',    value: `${sol.manm.length}/${sol.maxManm}` },
              { label:'Peryòd aktyèl',  value: fmtPeryod(sol.dateDebut, sol.frequence, peryodKouran) },
            ].map(({ label, value }) => (
              <div key={label} className="glass rounded-xl p-2.5 text-center border border-white/8">
                <div className="text-white font-bold text-sm">{value}</div>
                <div className="text-white/40 text-xs">{label}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>Chaj manm</span><span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/8">
              <motion.div className="h-full rounded-full"
                initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1, delay:.3 }}
                style={{ background:'linear-gradient(90deg,#FF3DA0,#A855F7)' }} />
            </div>
          </div>

          {dynamicNextRecipient && (
            <div className="glass rounded-2xl p-3 flex items-center gap-3 border border-yellow-500/20">
              <Crown size={20} style={{ color:'#FCD34D', filter:'drop-shadow(0 0 6px rgba(252,211,77,.7))' }} />
              <div>
                <p className="text-white/50 text-xs">Pwochèn moun ki pral touche</p>
                <p className="text-white font-bold text-sm">{getManmName(dynamicNextRecipient.recipient)}</p>
                <p className="text-white/30 text-[10px]">{getMonthName(dynamicNextRecipient.date)}</p>
              </div>
              <div className="ml-auto glass px-2.5 py-1 rounded-full text-xs font-bold" style={{ color:'#FCD34D', border:'1px solid #FCD34D44' }}>
                Peryòd {dynamicNextRecipient.peryod}
              </div>
            </div>
          )}

          {/* Analiz Dat ak Reta (Period & Delay Analysis) */}
          {sol.tirajFèt && (retaPeman.length > 0 || retaTouche.length > 0) && (
            <div className="glass rounded-2xl p-4 border border-red-500/20 space-y-3 mt-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-400" />
                <h4 className="text-white font-bold text-sm">Avètisman dat ak reta</h4>
              </div>
              
              {/* Reta Peman (Late Payments) */}
              {retaPeman.length > 0 && (
                <div className="space-y-2">
                  <p className="text-red-300 text-xs font-bold uppercase tracking-wide">Poko peye:</p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {retaPeman.map((rp, idx) => (
                      <div key={idx} className="bg-red-950/20 border border-red-900/30 rounded-xl p-2.5 text-xs">
                        <div className="flex justify-between text-red-300 font-semibold mb-1">
                          <span>Peryòd {rp.peryod}</span>
                           <span>Limit: {fmtDate(rp.dateLimit.toISOString())}{getRetaDaysText(rp.dateLimit)}</span>
                        </div>
                        <div className="text-white/75 space-y-1 mt-1.5">
                          {rp.manm.map(m => (
                            <div key={m.entryId} className="flex items-center justify-between py-0.5 border-b border-white/5 last:border-0">
                              <span>{getManmName(m)}</span>
                              {isChef && (
                                <button
                                  onClick={() => handleMarkPaid(m.userId, m.entryId, rp.peryod)}
                                  className="px-2 py-0.5 rounded bg-green-500 hover:bg-green-600 text-white font-bold text-[10px] transition-colors cursor-pointer"
                                >
                                  Mete Peye ✓
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reta Touche (Late Payouts) */}
              {retaTouche.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <p className="text-orange-300 text-xs font-bold uppercase tracking-wide">Poko touche:</p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {retaTouche.map((rt, idx) => (
                      <div key={idx} className="bg-orange-950/20 border border-orange-900/30 rounded-xl p-2.5 text-xs">
                        <div className="flex justify-between text-orange-300 font-semibold mb-1">
                          <span>Peryòd {rt.peryod}</span>
                           <span>Limit: {fmtDate(rt.dateLimit.toISOString())}{getRetaDaysText(rt.dateLimit)}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/75 mt-1.5">
                          <span>{getManmName(rt.recipient)}</span>
                          {isChef && (
                            <button
                              onClick={() => handleConfirmPayout(rt.recipient.userId, rt.peryod)}
                              className="px-2 py-0.5 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              Konfime 💰
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Action buttons (chef/admin only) */}
      {isChef && (
        <div className="grid grid-cols-3 gap-2">
          <Link href={`/sol/${id}/peman`}
            className="candy-btn-green flex items-center justify-center gap-1.5 py-3.5 text-white font-bold text-sm rounded-2xl"
            style={{ textDecoration:'none' }}>
            <CreditCard size={16} /> Peman
          </Link>
          {!sol.tirajFèt ? (
            <Link href={`/sol/${id}/tiraj`}
              className="candy-btn-pink flex items-center justify-center gap-1.5 py-3.5 text-white font-bold text-sm rounded-2xl"
              style={{ textDecoration:'none' }}>
              <Shuffle size={16} /> Tiraj
            </Link>
          ) : (
            <Link href={`/sol/${id}/tiraj`}
              className="glass flex items-center justify-center gap-1.5 py-3.5 text-white/70 font-bold text-sm rounded-2xl border border-white/15"
              style={{ textDecoration:'none' }}>
              <Shuffle size={16} /> Tiraj
            </Link>
          )}
          <Link href={`/sol/${id}/parametre`}
            className="glass flex items-center justify-center gap-1.5 py-3.5 text-white/70 font-bold text-sm rounded-2xl border border-white/15 hover:border-purple-500/30 hover:text-white transition-colors"
            style={{ textDecoration:'none' }}>
            <Settings size={16} /> Paramèt
          </Link>
        </div>
      )}

      {/* Touche card */}
      {ToucheCard}

      </div>{/* end left column */}

      {/* RIGHT COLUMN (desktop) / bottom section (mobile) */}
      <div className="space-y-4">

      {/* Tabs */}
      <div className="flex gap-2">
        {(['overview','manm'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab===t
              ? { background:'rgba(168,85,247,.25)', color:'#C084FC', border:'1px solid rgba(168,85,247,.4)' }
              : { background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.4)', border:'1px solid rgba(255,255,255,.08)' }}>
            {t==='overview' ? 'Peman' : `Manm (${sol.manm.length})`}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW (Payments) TAB ── */}
      {tab === 'overview' ? (
        <div className="space-y-3">
          {sol.description && (
            <div className="glass rounded-2xl p-4 border border-white/8">
              <p className="text-white/60 text-sm leading-relaxed">{sol.description}</p>
            </div>
          )}
          {(() => {
            const activePeriod = viewPeryod ?? peryodKouran
            const maxPeriod = sol.manm.length || sol.maxManm
            const paidForView = peman.filter(p => p.peryòd === activePeriod && p.status === 'peye')
            const unpaidForView = sol.manm.filter(m => !isSlotPaid(m, activePeriod))
            const isCurrentPeriod = activePeriod === peryodKouran
            return (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewPeryod(Math.max(1, activePeriod - 1))}
                      disabled={activePeriod <= 1}
                      className="p-1 rounded-lg transition-all hover:bg-white/10 disabled:opacity-20"
                      style={{ color: 'rgba(255,255,255,.5)' }}>
                      <ChevronLeft size={14} />
                    </button>
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider">
                      Peman — {fmtPeryod(sol.dateDebut, sol.frequence, activePeriod)}
                    </p>
                    <button onClick={() => setViewPeryod(Math.min(maxPeriod, activePeriod + 1))}
                      disabled={activePeriod >= maxPeriod}
                      className="p-1 rounded-lg transition-all hover:bg-white/10 disabled:opacity-20"
                      style={{ color: 'rgba(255,255,255,.5)' }}>
                      <ChevronRight size={14} />
                    </button>
                    {!isCurrentPeriod && (
                      <button onClick={() => setViewPeryod(null)}
                        className="ml-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition-all hover:bg-purple-500/20"
                        style={{ color:'#A855F7', border:'1px solid rgba(168,85,247,.3)' }}>
                        Jodi a
                      </button>
                    )}
                  </div>
                  <span className="text-white/30 text-xs">{paidForView.length}/{sol.manm.length} peye</span>
                </div>
                <div className="space-y-2">
                  {paidForView.map(p => (
                    <div key={p.id} className="glass rounded-xl p-3 flex items-center gap-3 border border-green-500/20">
                      <CheckCircle size={18} style={{ color:'#34D399' }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{p.prenom} {p.nom}</div>
                        <div className="text-white/40 text-xs">{fmtDate(p.datePeman)} • {p.metòd}</div>
                      </div>
                      <div className="text-green-400 font-bold text-sm">{fmtMontan(p.montan, p.devis)}</div>
                    </div>
                  ))}
                  {unpaidForView.map(m => (
                    <div key={m.entryId} className="glass rounded-xl p-3 flex items-center gap-3 border border-white/8 opacity-60">
                      <Clock size={18} style={{ color:'#FCD34D' }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{getManmName(m)}</div>
                        <div className="text-white/30 text-xs">Poko peye</div>
                      </div>
                      <div className="text-yellow-400 font-bold text-sm">{fmtMontan(sol.montant, sol.devis)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>

      ) : (
        /* ── MANM TAB ── */
        <div className="space-y-2">
          {isChef && (
            <Link href={`/sol/${id}/manm`}
              className="candy-btn w-full py-3 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 mb-4"
              style={{ textDecoration:'none' }}>
              <Users size={18} /> Jere Manm Yo
            </Link>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 px-1 mb-2">
            <span className="flex items-center gap-1 text-white/30 text-xs"><CheckCircle size={11} style={{ color:'#34D399' }}/> Peye</span>
            <span className="flex items-center gap-1 text-white/30 text-xs"><BadgeCheck size={11} style={{ color:'#38BDF8' }}/> Touche</span>
            <span className="flex items-center gap-1 text-white/30 text-xs"><Bell size={11} style={{ color:'#FB923C' }}/> Mande</span>
          </div>

          {sortedManm.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center border border-white/8">
              <p className="text-white/40 text-sm">Pa gen manm pou kounyela.</p>
            </div>
          ) : sortedManm.map((m, i) => {
            const hasPaid   = isSlotPaid(m, sol.peryòdAktif)
            const isCurrent = m.pozisyon > 0 && m.pozisyon === sol.peryòdAktif
            const isPast    = m.pozisyon > 0 && m.pozisyon < sol.peryòdAktif
            const tStatus   = m.pozisyon > 0 ? toucheByPoz.get(m.pozisyon) : undefined

            /* Visual state */
            const toucheKonfime = isPast && tStatus === 'konfime'
            const toucheDemande = isCurrent && tStatus === 'demande'

            return (
              <motion.div key={m.entryId}
                initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: i*.04 }}
                className="glass rounded-xl border transition-all"
                style={{ borderColor: isCurrent ? 'rgba(252,211,77,.4)' : toucheKonfime ? 'rgba(56,189,248,.2)' : 'rgba(255,255,255,.08)', opacity: toucheKonfime ? .75 : 1 }}>

                <div className="p-3 flex items-center gap-3">
                  {/* Position badge */}
                  {m.pozisyon > 0 ? (
                    <div style={{
                      width:32, height:32, borderRadius:'50%', flexShrink:0,
                      background: toucheKonfime
                        ? 'linear-gradient(135deg,#38BDF8,#0EA5E9)'
                        : `linear-gradient(135deg,${COLORS[i%COLORS.length]},${COLORS[(i+1)%COLORS.length]})`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:12, fontWeight:'bold', color:'white',
                      boxShadow: isCurrent ? `0 0 12px ${COLORS[i%COLORS.length]}66` : toucheKonfime ? '0 0 8px rgba(56,189,248,.4)' : 'none',
                    }}>
                      {toucheKonfime ? '✓' : m.pozisyon}
                    </div>
                  ) : (
                    <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background:'rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <AlertCircle size={14} className="text-white/30" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{getManmName(m)}</span>
                      {isCurrent && <Crown size={12} style={{ color:'#FCD34D', flexShrink:0 }} />}
                    </div>
                    <div className="text-white/40 text-xs">{m.telefon}</div>
                  </div>

                  {/* Right-side status icons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Payment status */}
                    {hasPaid
                      ? <CheckCircle size={16} style={{ color:'#34D399' }} aria-label="Peye" />
                      : <Clock size={16} style={{ color:'#FCD34D', opacity:.5 }} aria-label="Poko peye" />
                    }
                    {/* Payout (touche) status */}
                    {toucheKonfime && <BadgeCheck size={16} style={{ color:'#38BDF8', filter:'drop-shadow(0 0 4px rgba(56,189,248,.6))' }} aria-label="Deja touche" />}
                    {toucheDemande && <Bell size={16} style={{ color:'#FB923C' }} aria-label="Mande peman" />}
                    {isCurrent && !tStatus && <Crown size={16} style={{ color:'#FCD34D', filter:'drop-shadow(0 0 6px rgba(252,211,77,.7))' }} aria-label="Se tur li" />}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      </div>{/* end right column */}
      </div>{/* end two-column wrapper */}
    </div>
  )
}

function StatusBadge({ status }: { status: Sol['status'] }) {
  const map = { aktif:{label:'Aktif',color:'#34D399'}, konplè:{label:'Konplè',color:'#38BDF8'}, annatant:{label:'Annatant',color:'#FCD34D'}, rete:{label:'Rete',color:'#FB923C'} }
  const { label, color } = map[status] ?? { label:status, color:'#A855F7' }
  return <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ color, background:`${color}18`, border:`1px solid ${color}33` }}>{label}</span>
}

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid rgba(168,85,247,.2)', borderTopColor:'#A855F7', animation:'spin-slow 1s linear infinite' }} />
    </div>
  )
}
