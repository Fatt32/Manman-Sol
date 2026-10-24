'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Phone, Lock, Eye, EyeOff } from 'lucide-react'
import AnimatedBg from '@/components/AnimatedBg'

export default function KoneksyonPage() {
  const router = useRouter()
  const [telefon, setTelefon] = useState('')
  const [mdp, setMdp]         = useState('')
  const [showMdp, setShowMdp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefon, password: mdp }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Erè koneksyon'); return }
      router.push('/dashboard')
    } catch {
      setErr('Pa ka konekte. Verifye entènèt ou.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-16 overflow-hidden">
      <AnimatedBg />
      <div className="relative z-10 w-full max-w-sm space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <div style={{
            width:72, height:72, borderRadius:20, margin:'0 auto 16px',
            background:'linear-gradient(135deg,#FF3DA0,#A855F7)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 24px rgba(168,85,247,.5)',
          }}>
            <span style={{fontSize:36}}>💰</span>
          </div>
          <h1 className="text-3xl font-black text-white">Konekte</h1>
          <p className="text-white/50 text-sm">Antre nan kont ou pou jere sol ou</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          {err && (
            <div className="glass border border-red-500/30 rounded-2xl px-4 py-3 text-red-400 text-sm text-center">
              {err}
            </div>
          )}

          {/* Telefon */}
          <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/8 focus-within:border-purple-500/50 transition-colors">
            <Phone size={18} className="text-white/40 flex-shrink-0" />
            <input
              type="tel" value={telefon} onChange={e => setTelefon(e.target.value)}
              placeholder="Nimewo telefòn (509...)"
              required
              className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base"
            />
          </div>

          {/* Mot de passe */}
          <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/8 focus-within:border-purple-500/50 transition-colors">
            <Lock size={18} className="text-white/40 flex-shrink-0" />
            <input
              type={showMdp ? 'text' : 'password'} value={mdp} onChange={e => setMdp(e.target.value)}
              placeholder="Modpas"
              required
              className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base"
            />
            <button type="button" onClick={() => setShowMdp(!showMdp)} className="text-white/40 hover:text-white/70 transition-colors">
              {showMdp ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>

          <button
            type="submit" disabled={loading}
            className="candy-btn w-full py-4 text-white font-bold text-lg rounded-full disabled:opacity-60"
          >
            {loading ? 'Ap konekte…' : 'Konekte'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm">
          Pa gen kont?{' '}
          <Link href="/enrejistre" className="text-purple-400 font-semibold hover:text-purple-300">
            Kreye kont
          </Link>
        </p>
        <p className="text-center text-white/30 text-sm">
          <Link href="/reinisyalize" className="text-orange-400/70 hover:text-orange-400 transition-colors">
            Bliye modpas ou? →
          </Link>
        </p>

        <p className="text-center text-white/25 text-xs">
          <Link href="/" className="hover:text-white/40">← Retounen akèy</Link>
        </p>
      </div>
    </main>
  )
}
