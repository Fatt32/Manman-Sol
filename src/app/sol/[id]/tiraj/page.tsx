'use client'

import { useState, useEffect, use, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Shuffle, Trophy, Crown, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCookie, getInitials } from '@/lib/utils'
import type { Sol } from '@/lib/types'

const COLORS = ['#FF3DA0','#A855F7','#38BDF8','#34D399','#FCD34D','#FB923C']

interface DrawResult { userId:string; prenom:string; nom:string; pozisyon:number }

export default function TirajPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, loading } = useAuth()
  const [sol, setSol]       = useState<Sol | null>(null)
  const [phase, setPhase]   = useState<'idle'|'spinning'|'reveal'|'done'>('idle')
  const [results, setResults] = useState<DrawResult[]>([])
  const [revealed, setRevealed] = useState(0)
  const [err, setErr]       = useState('')
  const confettiRef         = useRef(false)

  const token = getCookie('sol_token')

  useEffect(() => {
    if (!token) return
    fetch(`/api/sol/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.sol) setSol(d.sol) })
  }, [id, token])

  /* Auto-reveal results one by one */
  useEffect(() => {
    if (phase !== 'reveal' || revealed >= results.length) return
    const t = setTimeout(() => setRevealed(r => r + 1), 700)
    return () => clearTimeout(t)
  }, [phase, revealed, results.length])

  useEffect(() => {
    if (revealed === results.length && results.length > 0 && phase === 'reveal') {
      setPhase('done')
      if (!confettiRef.current) {
        confettiRef.current = true
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({ particleCount:150, spread:80, origin:{ y:.6 },
            colors:['#FF3DA0','#A855F7','#38BDF8','#34D399','#FCD34D'] })
          setTimeout(() => confetti({ particleCount:80, angle:60, spread:60, origin:{ x:0, y:.7 } }), 400)
          setTimeout(() => confetti({ particleCount:80, angle:120, spread:60, origin:{ x:1, y:.7 } }), 600)
        })
      }
    }
  }, [revealed, results.length, phase])

  async function runTiraj() {
    if (!sol) return
    setErr(''); setPhase('spinning'); confettiRef.current = false
    try {
      const res = await fetch(`/api/sol/${id}/tiraj`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' },
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Erè tiraj'); setPhase('idle'); return }
      const sorted = [...data.rezilta].sort((a:DrawResult,b:DrawResult) => a.pozisyon - b.pozisyon)
      setResults(sorted)
      /* Let spinner run 2.5s then reveal */
      setTimeout(() => { setPhase('reveal'); setRevealed(0) }, 2500)
      /* Reload sol to get updated positions */
      fetch(`/api/sol/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.sol) setSol(d.sol) })
    } catch { setErr('Erè rezo'); setPhase('idle') }
  }

  if (loading || !user) return null
  if (!sol) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid rgba(168,85,247,.2)', borderTopColor:'#A855F7', animation:'spin-slow 1s linear infinite' }} />
    </div>
  )

  const isChef = sol.chefId === user.id || user.role === 'admin'
  const alreadyDone = sol.tirajFèt && phase === 'idle'
  const existingOrder = [...sol.manm].sort((a,b)=>(a.pozisyon||999)-(b.pozisyon||999)).filter(m=>m.pozisyon>0)

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/sol/${id}`} className="glass p-2 rounded-xl text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Tiraj Osò</h1>
          <p className="text-white/40 text-xs">{sol.nom}</p>
        </div>
      </div>

      {/* Spinning animation */}
      <AnimatePresence mode="wait">
        {phase === 'spinning' && (
          <motion.div key="spin"
            initial={{ opacity:0, scale:.8 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:.8 }}
            className="flex flex-col items-center gap-6 py-12">
            {/* Spinning wheel visual */}
            <div className="relative" style={{ width:180, height:180 }}>
              {/* Outer glow ring */}
              <div style={{
                position:'absolute', inset:-8,
                borderRadius:'50%',
                border:'2px solid transparent',
                background:'conic-gradient(from 0deg,#FF3DA0,#A855F7,#38BDF8,#34D399,#FCD34D,#FB923C,#FF3DA0) border-box',
                animation:'spin-slow .6s linear infinite',
                opacity:.8,
              }} />
              {/* Inner spinning disc */}
              <div style={{
                width:180, height:180, borderRadius:'50%',
                background:'conic-gradient(from 0deg,#FF3DA0,#A855F7,#38BDF8,#34D399,#FCD34D,#FB923C,#FF3DA0)',
                animation:'draw-spin .8s cubic-bezier(.4,0,.6,1) infinite',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <div style={{
                  width:120, height:120, borderRadius:'50%',
                  background:'#04041a',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Shuffle size={40} style={{ color:'white', filter:'drop-shadow(0 0 12px rgba(168,85,247,.9))' }} />
                </div>
              </div>
              {/* Sparkles */}
              {[0,60,120,180,240,300].map(deg => (
                <div key={deg} style={{
                  position:'absolute', top:'50%', left:'50%',
                  transform:`rotate(${deg}deg) translateY(-105px)`,
                  animation:`sparkle-pop ${.8+deg/300}s ease-in-out infinite`,
                }}>
                  <Sparkles size={14} style={{ color: COLORS[deg/60 % COLORS.length] }} />
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-2xl font-black gradient-text">Ap fè Tiraj…</p>
              <p className="text-white/40 text-sm mt-1">Kap chwazi lòd manm yo</p>
            </div>
          </motion.div>
        )}

        {(phase === 'reveal' || phase === 'done') && (
          <motion.div key="reveal" initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-4">
            <div className="text-center space-y-2 py-4">
              <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', bounce:.6 }}>
                <Trophy size={48} style={{ margin:'0 auto', color:'#FCD34D', filter:'drop-shadow(0 0 16px rgba(252,211,77,.8))' }} />
              </motion.div>
              <h2 className="text-2xl font-black gradient-text">Rezilta Tiraj la!</h2>
              <p className="text-white/50 text-sm">Lòd ki va touche sak la</p>
            </div>

            <div className="space-y-2">
              {results.slice(0, revealed).map((r, i) => (
                <motion.div key={r.userId}
                  initial={{ opacity:0, x:-40, scale:.8 }}
                  animate={{ opacity:1, x:0, scale:1 }}
                  transition={{ type:'spring', bounce:.4, duration:.5 }}
                  className="glass rounded-2xl p-4 flex items-center gap-4 border card-depth relative overflow-hidden"
                  style={{ borderColor: i===0 ? 'rgba(252,211,77,.4)' : `${COLORS[i%COLORS.length]}22` }}>
                  {/* Shine effect */}
                  {i === 0 && (
                    <div className="absolute inset-0 card-shine" />
                  )}
                  {/* Position number */}
                  <div style={{
                    width:48, height:48, borderRadius:14, flexShrink:0,
                    background: i===0
                      ? 'linear-gradient(135deg,#FCD34D,#FB923C)'
                      : `linear-gradient(135deg,${COLORS[i%COLORS.length]},${COLORS[(i+1)%COLORS.length]})`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: i===0 ? '0 4px 20px rgba(252,211,77,.6)' : `0 4px 12px ${COLORS[i%COLORS.length]}44`,
                    fontSize:20, fontWeight:'black', color:'white',
                  }}>
                    {r.pozisyon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-black text-base">{r.prenom} {r.nom}</div>
                    {i===0 && <div className="text-yellow-400 text-xs font-bold">👑 Touche Anpremye!</div>}
                  </div>
                  {i===0 && <Crown size={24} style={{ color:'#FCD34D', filter:'drop-shadow(0 0 8px rgba(252,211,77,.8))' }} />}
                </motion.div>
              ))}
              {/* Pending items (ghost) */}
              {results.slice(revealed).map((r) => (
                <div key={r.userId}
                  className="glass rounded-2xl p-4 flex items-center gap-4 border border-white/8 opacity-30">
                  <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,.08)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-full bg-white/10 w-32" />
                    <div className="h-2 rounded-full bg-white/8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing order (after tiraj) or idle state */}
      {phase === 'idle' && alreadyDone && existingOrder.length > 0 && (
        <div className="space-y-3">
          <div className="text-center py-4">
            <Trophy size={40} style={{ margin:'0 auto 8px', color:'#FCD34D' }} />
            <p className="text-xl font-black text-white">Tiraj Deja Fèt</p>
            <p className="text-white/40 text-sm">Wè lòd manm yo anba</p>
          </div>
          <div className="space-y-2">
            {existingOrder.map((m, i) => (
              <div key={m.entryId || i}
                className="glass rounded-2xl p-3.5 flex items-center gap-3 border"
                style={{ borderColor: i===0 ? 'rgba(252,211,77,.3)' : 'rgba(255,255,255,.08)' }}>
                <div style={{
                  width:40, height:40, borderRadius:12, flexShrink:0,
                  background: i===0 ? 'linear-gradient(135deg,#FCD34D,#FB923C)' : `linear-gradient(135deg,${COLORS[i%COLORS.length]},${COLORS[(i+1)%COLORS.length]})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:16, fontWeight:'bold', color:'white',
                }}>
                  {m.pozisyon}
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-sm">{m.prenom} {m.nom}</div>
                  <div className="text-white/40 text-xs">{m.telefon}</div>
                </div>
                {i===0 && <Crown size={18} style={{ color:'#FCD34D' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA buttons */}
      {phase === 'idle' && isChef && !alreadyDone && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4 border border-white/8 text-center space-y-2">
            <Shuffle size={36} style={{ margin:'0 auto', color:'#A855F7' }} />
            <p className="text-white font-bold">Prè pou Tiraj?</p>
            <p className="text-white/50 text-sm">
              {sol.manm.length} manm ap patisipe. Tiraj la pral chwazi lòd chak moun ki va touche sak la.
            </p>
          </div>
          {err && <p className="text-red-400 text-sm text-center">{err}</p>}
          {sol.manm.length < 2
            ? <p className="text-center text-yellow-400/70 text-sm">Bezwen omwen 2 manm pou fè tiraj.</p>
            : (
              <button onClick={runTiraj}
                className="candy-btn-pink w-full py-4 text-white font-black text-lg rounded-full flex items-center justify-center gap-3">
                <Shuffle size={22} /> Kòmanse Tiraj Osò!
              </button>
            )
          }
        </div>
      )}

      {phase === 'done' && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="flex gap-3">
          <Link href={`/sol/${id}`}
            className="flex-1 glass py-4 text-white/70 font-bold rounded-full border border-white/15 text-center text-sm"
            style={{ textDecoration:'none' }}>
            ← Sol la
          </Link>
          <Link href={`/sol/${id}/peman`}
            className="flex-[2] candy-btn-green py-4 text-white font-bold text-base rounded-full text-center flex items-center justify-center gap-2"
            style={{ textDecoration:'none' }}>
            Swiv Peman →
          </Link>
        </motion.div>
      )}
    </div>
  )
}
