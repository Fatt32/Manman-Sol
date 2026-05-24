'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut, Shield, User, Phone, Calendar,
  Pencil, X, Check, Eye, EyeOff, Lock,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCookie, setCookie, deleteCookie, fmtDate, getInitials } from '@/lib/utils'

const ROLE_LABEL: Record<string,string> = { admin:'Administratè', chef:'Chef Sol', manm:'Manm' }
const ROLE_COLOR: Record<string,string> = { admin:'#FF3DA0', chef:'#A855F7', manm:'#38BDF8' }

interface EditForm {
  prenom: string; nom: string; telefon: string
  ancienModpas: string; nouveauModpas: string; konfimeModpas: string
}

export default function ProfilPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [editing, setEditing]     = useState(false)
  const [saving,  setSaving]      = useState(false)
  const [msg,     setMsg]         = useState<{ text:string; ok:boolean } | null>(null)
  const [showOld, setShowOld]     = useState(false)
  const [showNew, setShowNew]     = useState(false)
  const [confirming, setConfirming] = useState(false)

  const [form, setForm] = useState<EditForm>({
    prenom:'', nom:'', telefon:'',
    ancienModpas:'', nouveauModpas:'', konfimeModpas:'',
  })

  function openEdit() {
    if (!user) return
    setForm({ prenom:user.prenom, nom:user.nom, telefon:user.telefon, ancienModpas:'', nouveauModpas:'', konfimeModpas:'' })
    setEditing(true)
    setMsg(null)
  }

  function closeEdit() { setEditing(false); setMsg(null) }

  async function save() {
    if (!user) return

    /* Client-side validation */
    if (!form.prenom.trim() || !form.nom.trim()) {
      setMsg({ text:'Prenon ak siyati obligatwa.', ok:false }); return
    }
    if (form.nouveauModpas && form.nouveauModpas !== form.konfimeModpas) {
      setMsg({ text:'Nouvo modpas ak konfirmasyon pa matche.', ok:false }); return
    }
    if (form.nouveauModpas && form.nouveauModpas.length < 4) {
      setMsg({ text:'Nouvo modpas dwe gen omwen 4 karaktè.', ok:false }); return
    }

    setSaving(true); setMsg(null)
    try {
      const token = getCookie('sol_token')
      const body: Record<string,string> = {
        prenom:       form.prenom.trim(),
        nom:          form.nom.trim(),
      }
      if (user.role === 'admin' && form.telefon.trim())
        body.telefon = form.telefon.trim()
      if (form.nouveauModpas) {
        body.ancienModpas  = form.ancienModpas
        body.nouveauModpas = form.nouveauModpas
      }

      const res  = await fetch('/api/profil', {
        method:'PUT',
        headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ text: data.error || 'Erè', ok:false }); return }

      /* Save the fresh token and reload */
      setCookie('sol_token', data.token, 30)
      setMsg({ text:'Pwofil ou mete ajou avèk siksè!', ok:true })
      setEditing(false)
      router.refresh()
    } catch {
      setMsg({ text:'Erè rezo', ok:false })
    } finally {
      setSaving(false)
    }
  }

  function logout() {
    deleteCookie('sol_token')
    router.push('/koneksyon')
  }

  if (loading || !user) return <Loader />

  const color = ROLE_COLOR[user.role] ?? '#A855F7'

  return (
    <div className="max-w-md mx-auto space-y-5">

      {/* Avatar hero */}
      <motion.div initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }}
        className="flex flex-col items-center text-center gap-3 py-5">
        <div style={{
          width:96, height:96, borderRadius:28,
          background:`linear-gradient(135deg,${color},#A855F7)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:36, fontWeight:'bold', color:'white',
          boxShadow:`0 8px 32px ${color}55, 0 0 0 3px ${color}22`,
        }}>
          {getInitials(user.prenom, user.nom)}
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{user.prenom} {user.nom}</h1>
          <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-bold"
            style={{ color, background:`${color}18`, border:`1px solid ${color}33` }}>
            <Shield size={11}/> {ROLE_LABEL[user.role] ?? user.role}
          </div>
        </div>
      </motion.div>

      {/* Flash */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="glass rounded-2xl px-4 py-3 text-sm text-center font-semibold border"
            style={{ color:msg.ok?'#34D399':'#F87171', borderColor:msg.ok?'#34D399':'#F8717133' }}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info display + edit toggle */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Enfòmasyon Mwen</p>
          {!editing ? (
            <button onClick={openEdit}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color:'#C084FC', background:'rgba(168,85,247,.12)', border:'1px solid rgba(168,85,247,.25)' }}>
              <Pencil size={12}/> Modifye
            </button>
          ) : (
            <button onClick={closeEdit} className="text-white/40 hover:text-white/70 transition-colors p-1">
              <X size={16}/>
            </button>
          )}
        </div>

        {/* Static display */}
        <AnimatePresence initial={false}>
          {!editing && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {[
                { icon:User,     label:'Non Konplè', value:`${user.prenom} ${user.nom}` },
                { icon:Phone,    label:'Telefon',     value: user.telefon },
                { icon:Calendar, label:'Manm Depi',   value: fmtDate(user.createdAt) },
                { icon:Shield,   label:'Wòl',         value: ROLE_LABEL[user.role] ?? user.role },
              ].map(({ icon:Icon, label, value }, i, arr) => (
                <div key={label}
                  className={`px-4 py-3.5 flex items-center gap-3 ${i < arr.length-1 ? 'border-b border-white/5' : ''}`}>
                  <div style={{ width:34, height:34, borderRadius:9, background:'rgba(168,85,247,.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={16} style={{ color:'#A855F7' }} />
                  </div>
                  <div>
                    <div className="text-white/40 text-xs">{label}</div>
                    <div className="text-white font-semibold text-sm">{value}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit form */}
        <AnimatePresence initial={false}>
          {editing && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
              exit={{ opacity:0, height:0 }} className="overflow-hidden">
              <div className="px-4 py-4 space-y-4">

                {/* Name fields */}
                <div className="space-y-1">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Non</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Field icon={User} placeholder="Prenon" value={form.prenom}
                      onChange={v => setForm(f=>({...f,prenom:v}))} />
                    <Field icon={User} placeholder="Siyati" value={form.nom}
                      onChange={v => setForm(f=>({...f,nom:v}))} />
                  </div>
                </div>

                {/* Phone — admin only */}
                {user.role === 'admin' ? (
                  <div className="space-y-1">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      Telefon <span className="text-pink-400/60 text-xs font-normal normal-case">admin sèlman</span>
                    </p>
                    <Field icon={Phone} placeholder="Nimewo telefon" type="tel" value={form.telefon}
                      onChange={v => setForm(f=>({...f,telefon:v}))} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5 glass rounded-xl border border-white/8">
                    <Lock size={14} className="text-white/25 flex-shrink-0"/>
                    <span className="text-white/30 text-xs">Nimewo telefon — sèlman admin ka chanje sa</span>
                  </div>
                )}

                {/* Password change */}
                <div className="space-y-2">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Chanje Modpas (opsyonèl)</p>
                  <div className="relative">
                    <Field icon={Lock} placeholder="Ansyen modpas" type={showOld?'text':'password'}
                      value={form.ancienModpas} onChange={v => setForm(f=>({...f,ancienModpas:v}))} />
                    <button type="button" onClick={() => setShowOld(s=>!s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showOld ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  <div className="relative">
                    <Field icon={Lock} placeholder="Nouvo modpas" type={showNew?'text':'password'}
                      value={form.nouveauModpas} onChange={v => setForm(f=>({...f,nouveauModpas:v}))} />
                    <button type="button" onClick={() => setShowNew(s=>!s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showNew ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  {form.nouveauModpas && (
                    <Field icon={Lock} placeholder="Konfime nouvo modpas" type="password"
                      value={form.konfimeModpas} onChange={v => setForm(f=>({...f,konfimeModpas:v}))} />
                  )}
                </div>

                {/* Save / Cancel */}
                <div className="flex gap-2 pt-1">
                  <button onClick={closeEdit}
                    className="flex-1 glass py-3 rounded-xl text-white/50 font-semibold border border-white/15 text-sm">
                    Anile
                  </button>
                  <button onClick={save} disabled={saving}
                    className="flex-[2] candy-btn py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    <Check size={15}/> {saving ? 'Ap sove…' : 'Sove Chanjman'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout */}
      <div>
        {!confirming ? (
          <button onClick={() => setConfirming(true)}
            className="w-full glass py-4 rounded-2xl text-red-400 font-bold border border-red-500/20 flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors">
            <LogOut size={18}/> Dekonekte
          </button>
        ) : (
          <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }}
            className="glass rounded-2xl p-4 border border-red-500/30 space-y-3">
            <p className="text-white/70 text-sm text-center">Ou sèten ou vle dekonekte?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(false)}
                className="flex-1 glass py-3 rounded-xl text-white/50 font-semibold border border-white/15 text-sm">
                Anile
              </button>
              <button onClick={logout}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm"
                style={{ background:'linear-gradient(135deg,#EF4444,#DC2626)', boxShadow:'0 4px 12px rgba(239,68,68,.4)' }}>
                Wi, Dekonekte
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <p className="text-center text-white/20 text-xs pb-4">Manman Sol v1.0 • Ayiti 🇭🇹</p>
    </div>
  )
}

/* ── Reusable field ───────────────────────────────────────────────── */
function Field({ icon:Icon, placeholder, value, onChange, type='text' }:
  { icon:React.ComponentType<{size?:number;className?:string}>; placeholder:string; value:string; onChange:(v:string)=>void; type?:string }) {
  return (
    <div className="glass rounded-xl flex items-center gap-2 px-3 py-2.5 border border-white/8 focus-within:border-purple-500/40">
      <Icon size={14} className="text-white/35 flex-shrink-0"/>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="flex-1 bg-transparent text-white placeholder-white/25 outline-none text-sm pr-6" />
    </div>
  )
}

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid rgba(168,85,247,.2)', borderTopColor:'#A855F7', animation:'spin-slow 1s linear infinite' }} />
    </div>
  )
}
