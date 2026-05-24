'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Lock, Key, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import AnimatedBg from '@/components/AnimatedBg'
import { setCookie } from '@/lib/utils'

export default function ReinisyalizePage() {
  const router = useRouter()
  const [step, setStep]       = useState<1|2>(1)
  const [telefon, setTelefon] = useState('')
  const [code, setCode]       = useState('')
  const [mdp, setMdp]         = useState('')
  const [confirm, setConfirm] = useState('')
  const [showMdp, setShowMdp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  const [msg, setMsg]         = useState('')

  async function requestCode(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefon }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error); return }
      setMsg(data.message)
      setStep(2)
    } catch { setErr('Erè rezo') }
    finally { setLoading(false) }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (mdp !== confirm) { setErr('Modpas yo pa menm'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset?step=confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefon, code, newPassword: mdp }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error); return }
      router.push('/koneksyon?reset=ok')
    } catch { setErr('Erè rezo') }
    finally { setLoading(false) }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-16 overflow-hidden">
      <AnimatedBg />
      <div className="relative z-10 w-full max-w-sm space-y-6">

        <div className="text-center space-y-2">
          <div style={{
            width:72, height:72, borderRadius:20, margin:'0 auto 12px',
            background:'linear-gradient(135deg,#FCD34D,#FB923C)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 24px rgba(251,146,60,.5)',
          }}>
            <span style={{fontSize:36}}>🔑</span>
          </div>
          <h1 className="text-2xl font-black text-white">Reinisyalize Modpas</h1>
          <p className="text-white/50 text-sm">Etap {step} / 2</p>
        </div>

        {/* Progress */}
        <div className="h-1.5 rounded-full bg-white/8">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width:`${step*50}%`, background:'linear-gradient(90deg,#FCD34D,#FB923C)' }} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form key="s1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
              onSubmit={requestCode} className="space-y-4">
              <p className="text-white/60 text-sm text-center">
                Antre nimewo telefòn ou. Yon kòd pral voye bay Manman Sol ou pou li ba ou li.
              </p>
              {err && <div className="glass border border-red-500/30 rounded-2xl px-4 py-3 text-red-400 text-sm text-center">{err}</div>}
              <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-white/8 focus-within:border-orange-500/50 transition-colors">
                <Phone size={18} className="text-white/40 flex-shrink-0" />
                <input type="tel" value={telefon} onChange={e => setTelefon(e.target.value)}
                  placeholder="Nimewo telefòn (509...)" required
                  className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 text-white font-black text-base rounded-full disabled:opacity-60"
                style={{ background:'linear-gradient(160deg,#FCD34D,#FB923C)', boxShadow:'0 6px 0 #92400E,0 10px 24px rgba(251,146,60,.5)' }}>
                {loading ? 'Ap voye…' : 'Mande Kòd'}
              </button>
            </motion.form>
          ) : (
            <motion.form key="s2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
              onSubmit={confirmReset} className="space-y-4">
              {msg && <div className="glass border border-yellow-500/30 rounded-2xl px-4 py-3 text-yellow-400 text-sm text-center">{msg}</div>}
              {err && <div className="glass border border-red-500/30 rounded-2xl px-4 py-3 text-red-400 text-sm text-center">{err}</div>}

              <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-white/8 focus-within:border-orange-500/50 transition-colors">
                <Key size={18} className="text-white/40 flex-shrink-0" />
                <input type="text" value={code} onChange={e => setCode(e.target.value)}
                  placeholder="Kòd 6 chif (soti kote Manman Sol)" required maxLength={6}
                  className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base tracking-widest" />
              </div>
              <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-white/8 focus-within:border-orange-500/50 transition-colors">
                <Lock size={18} className="text-white/40 flex-shrink-0" />
                <input type={showMdp ? 'text':'password'} value={mdp} onChange={e => setMdp(e.target.value)}
                  placeholder="Nouvo modpas" required
                  className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base" />
                <button type="button" onClick={() => setShowMdp(!showMdp)} className="text-white/40 hover:text-white/70 transition-colors">
                  {showMdp ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
              <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-white/8 focus-within:border-orange-500/50 transition-colors">
                <Lock size={18} className="text-white/40 flex-shrink-0" />
                <input type={showMdp ? 'text':'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Konfime nouvo modpas" required
                  className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="glass px-4 py-3.5 rounded-full border border-white/15 text-white/60 text-sm">
                  <ArrowLeft size={18} />
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-4 text-white font-black text-base rounded-full disabled:opacity-60"
                  style={{ background:'linear-gradient(160deg,#FCD34D,#FB923C)', boxShadow:'0 6px 0 #92400E,0 10px 24px rgba(251,146,60,.5)' }}>
                  {loading ? 'Ap chanje…' : 'Chanje Modpas ✓'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-white/40 text-sm">
          <Link href="/koneksyon" className="text-purple-400 hover:text-purple-300">← Retounen koneksyon</Link>
        </p>
      </div>
    </main>
  )
}
