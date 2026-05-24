'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import AnimatedBg from '@/components/AnimatedBg'
import { setCookie } from '@/lib/utils'

export default function EnrejistrePage() {
  const router = useRouter()
  const [form, setForm] = useState({ prenom:'', nom:'', telefon:'', password:'', confirm:'' })
  const [showMdp, setShowMdp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom: form.prenom, nom: form.nom, telefon: form.telefon, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Erè enrejistreman'); return }
      setCookie('sol_token', data.token)
      router.push('/dashboard')
    } catch {
      setErr('Pa ka konekte. Verifye entènèt ou.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key:'prenom',   icon:User,  type:'text',     placeholder:'Prenon' },
    { key:'nom',      icon:User,  type:'text',     placeholder:'Non (Siyati)' },
    { key:'telefon',  icon:Phone, type:'tel',      placeholder:'Nimewo telefòn (509...)' },
    { key:'password', icon:Lock,  type:'password', placeholder:'Modpas (min. 6 karaktè)' },
    { key:'confirm',  icon:Lock,  type:'password', placeholder:'Konfime modpas' },
  ] as const

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden">
      <AnimatedBg />
      <div className="relative z-10 w-full max-w-sm space-y-5">

        <div className="text-center space-y-1">
          <div style={{
            width:72, height:72, borderRadius:20, margin:'0 auto 16px',
            background:'linear-gradient(135deg,#34D399,#38BDF8)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 24px rgba(52,211,153,.45)',
          }}>
            <span style={{fontSize:36}}>✨</span>
          </div>
          <h1 className="text-3xl font-black text-white">Kreye Kont</h1>
          <p className="text-white/50 text-sm">Ranpli enfòmasyon ou pou kòmanse</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {err && (
            <div className="glass border border-red-500/30 rounded-2xl px-4 py-3 text-red-400 text-sm text-center">{err}</div>
          )}

          {fields.map(({ key, icon: Icon, type, placeholder }) => {
            const isPass = key === 'password' || key === 'confirm'
            return (
              <div key={key} className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/8 focus-within:border-green-500/50 transition-colors">
                <Icon size={18} className="text-white/40 flex-shrink-0" />
                <input
                  type={isPass && showMdp ? 'text' : type}
                  value={form[key as keyof typeof form]}
                  onChange={upd(key as keyof typeof form)}
                  placeholder={placeholder}
                  required
                  className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base"
                />
                {isPass && key === 'password' && (
                  <button type="button" onClick={() => setShowMdp(!showMdp)} className="text-white/40 hover:text-white/70 transition-colors">
                    {showMdp ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                )}
              </div>
            )
          })}

          <button
            type="submit" disabled={loading}
            className="candy-btn-green w-full py-4 text-white font-bold text-lg rounded-full disabled:opacity-60"
          >
            {loading ? 'Ap kreye kont…' : 'Kreye Kont'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm">
          Gen kont deja?{' '}
          <Link href="/koneksyon" className="text-purple-400 font-semibold hover:text-purple-300">
            Konekte
          </Link>
        </p>
      </div>
    </main>
  )
}
