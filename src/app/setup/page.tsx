'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Phone, Lock, Eye, EyeOff, Shield } from 'lucide-react'
import AnimatedBg from '@/components/AnimatedBg'

export default function SetupPage() {
  const router = useRouter()
  const [ready, setReady]   = useState<boolean | null>(null)
  const [showMdp, setShowMdp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]       = useState('')
  const [form, setForm]     = useState({ prenom:'', nom:'', telefon:'', password:'', confirm:'' })

  useEffect(() => {
    fetch('/api/setup').then(r => r.json()).then(d => {
      if (!d.ready) router.replace('/koneksyon')
      else setReady(true)
    })
  }, [router])

  function upd(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (form.password !== form.confirm) { setErr('Modpas yo pa menm'); return }
    if (form.password.length < 6)       { setErr('Modpas dwe gen 6 karaktè minimum'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom: form.prenom, nom: form.nom, telefon: form.telefon, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error); return }
      router.push('/dashboard')
    } catch { setErr('Erè rezo') }
    finally { setLoading(false) }
  }

  if (ready === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid rgba(168,85,247,.2)', borderTopColor:'#A855F7', animation:'spin-slow 1s linear infinite' }} />
    </div>
  )

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden">
      <AnimatedBg />
      <div className="relative z-10 w-full max-w-sm space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
          className="text-center space-y-3">
          <div style={{
            width:80, height:80, borderRadius:24, margin:'0 auto',
            background:'linear-gradient(135deg,#FF3DA0,#A855F7,#38BDF8)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 32px rgba(168,85,247,.6)',
            animation:'float-gentle 3.5s ease-in-out infinite',
          }}>
            <span style={{fontSize:40}}>💰</span>
          </div>
          <div>
            <h1 className="text-3xl font-black gradient-text">Manman Sol</h1>
            <p className="text-white/50 text-sm mt-1">Konfigirasyon Premye Administratè</p>
          </div>
          <div className="glass rounded-2xl px-4 py-3 border border-purple-500/20 flex items-center gap-2">
            <Shield size={16} style={{ color:'#A855F7', flexShrink:0 }} />
            <p className="text-white/60 text-xs text-left">
              Ou pral kreye <span className="text-purple-400 font-bold">kont admin prensipal</span> la — Manman Sol. Sa a fèt yon sèl fwa.
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form onSubmit={submit} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:.15 }} className="space-y-3">
          {err && (
            <div className="glass border border-red-500/30 rounded-2xl px-4 py-3 text-red-400 text-sm text-center">
              {err}
            </div>
          )}

          {[
            { key:'prenom',  icon:User,  type:'text', placeholder:'Prenon ou' },
            { key:'nom',     icon:User,  type:'text', placeholder:'Siyati ou' },
            { key:'telefon', icon:Phone, type:'tel',  placeholder:'Nimewo telefòn (509...)' },
          ].map(({ key, icon:Icon, type, placeholder }) => (
            <div key={key} className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-white/8 focus-within:border-purple-500/50 transition-colors">
              <Icon size={18} className="text-white/40 flex-shrink-0" />
              <input type={type} value={form[key as keyof typeof form]}
                onChange={upd(key as keyof typeof form)}
                placeholder={placeholder} required
                className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base" />
            </div>
          ))}

          {/* Password */}
          <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-white/8 focus-within:border-purple-500/50 transition-colors">
            <Lock size={18} className="text-white/40 flex-shrink-0" />
            <input type={showMdp ? 'text' : 'password'} value={form.password}
              onChange={upd('password')} placeholder="Modpas (min. 6 karaktè)" required
              className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base" />
            <button type="button" onClick={() => setShowMdp(!showMdp)} className="text-white/40 hover:text-white/70 transition-colors">
              {showMdp ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
          <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-white/8 focus-within:border-purple-500/50 transition-colors">
            <Lock size={18} className="text-white/40 flex-shrink-0" />
            <input type={showMdp ? 'text' : 'password'} value={form.confirm}
              onChange={upd('confirm')} placeholder="Konfime modpas" required
              className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base" />
          </div>

          <button type="submit" disabled={loading}
            className="candy-btn w-full py-4 text-white font-black text-lg rounded-full disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? 'Ap kreye…' : <><Shield size={20}/> Kreye Kont Admin</>}
          </button>
        </motion.form>
      </div>
    </main>
  )
}
