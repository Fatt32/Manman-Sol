'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Save, Trash2, AlertTriangle, X,
  ToggleLeft, ToggleRight, Settings, Coins, Users, Calendar,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCookie, AUTH_COOKIE, fmtMontan } from '@/lib/utils'
import type { Sol, SolStatus, Frequence, Devis } from '@/lib/types'

const FREQUENCES: [Frequence, string][] = [
  ['chak-semèn', 'Chak Semèn'],
  ['de-semèn',   '15 Jou'],
  ['chak-mwa',   'Chak Mwa'],
  ['3-mwa',      '3 Mwa'],
  ['6-mwa',      '6 Mwa'],
  ['ane',        'Chak Ane'],
]

const STATUSES: [SolStatus, string, string][] = [
  ['annatant', 'Annatant', '#FCD34D'],
  ['aktif',    'Aktif',    '#34D399'],
  ['konplè',   'Konplè',   '#38BDF8'],
  ['rete',     'Rete',     '#FB923C'],
]

interface FormState {
  nom:         string
  description: string
  dateDebut:   string
  frequence:   Frequence
  maxManm:     number
  devis:       Devis
  status:      SolStatus
  peryòdAktif: number
  tirajFèt:    boolean
}

export default function ParametrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params)
  const { user, loading } = useAuth()
  const router  = useRouter()
  const [sol, setSol]   = useState<Sol | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const token = getCookie(AUTH_COOKIE)
  const h = { 'Content-Type': 'application/json' }

  useEffect(() => {
    if (!token) return
    fetch(`/api/sol/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.sol) return
        setSol(d.sol)
        setForm({
          nom:         d.sol.nom,
          description: d.sol.description || '',
          dateDebut:   d.sol.dateDebut.slice(0, 10),
          frequence:   d.sol.frequence,
          maxManm:     d.sol.maxManm,
          devis:       d.sol.devis,
          status:      d.sol.status,
          peryòdAktif: d.sol.peryòdAktif,
          tirajFèt:    d.sol.tirajFèt,
        })
      })
  }, [id, token])

  function flash(text: string, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 4000)
  }

  function upd<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => f ? { ...f, [k]: v } : f)
  }

  async function save() {
    if (!form || !sol) return
    if (!form.nom.trim()) { flash('Non sol la obligatwa.', false); return }
    if (form.maxManm < sol.manm.length) {
      flash(`Pa ka bese limit anba ${sol.manm.length} (kantite manm aktyèl).`, false); return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/sol/${id}`, { method: 'PUT', headers: h, body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) { setSol(data.sol); flash('Chanjman yo sove avèk siksè!') }
      else flash(data.error || 'Erè', false)
    } catch { flash('Erè rezo', false) }
    finally { setSaving(false) }
  }

  async function deleteSol() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/sol/${id}`, { method: 'DELETE', headers: h })
      if (res.ok) router.push('/sol')
      else { const d = await res.json(); flash(d.error || 'Erè efase', false); setDelConfirm(false) }
    } catch { flash('Erè rezo', false) }
    finally { setDeleting(false) }
  }

  if (loading || !user) return null
  if (!sol || !form) return <Loader />

  const isChef = sol.chefId === user.id || user.role === 'admin'
  if (!isChef) return (
    <div className="flex items-center justify-center min-h-[60vh] text-center px-6">
      <p className="text-white/40">Ou pa gen aksè pou modifye paramèt sol sa a.</p>
    </div>
  )

  return (
    <div className="max-w-md lg:max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/sol/${id}`} className="glass p-2 rounded-xl text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Settings size={18} style={{ color:'#A855F7' }} /> Paramèt Sol
          </h1>
          <p className="text-white/40 text-xs">{sol.nom}</p>
        </div>
      </div>

      {/* Flash */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="glass rounded-2xl px-4 py-3 text-sm text-center font-semibold border"
            style={{ color: msg.ok ? '#34D399' : '#F87171', borderColor: msg.ok ? '#34D39944' : '#F8717133' }}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SECTION: Jeneral ── */}
      <Card title="Enfòmasyon Jeneral">
        <Field label="Non Sol La">
          <input value={form.nom} onChange={e => upd('nom', e.target.value)}
            className="w-full bg-transparent text-white placeholder-white/30 outline-none text-sm"
            placeholder="Non sol la…" />
        </Field>
        <Field label="Deskripsyon (opsyonèl)">
          <textarea value={form.description} onChange={e => upd('description', e.target.value)}
            rows={2} placeholder="Bi sol la…" className="w-full bg-transparent text-white placeholder-white/30 outline-none text-sm resize-none" />
        </Field>
      </Card>

      {/* ── SECTION: Kalandriye ── */}
      <Card title="Kalandriye">
        <Field label="Dat Kòmansman">
          <input type="date" value={form.dateDebut} onChange={e => upd('dateDebut', e.target.value)}
            className="w-full bg-transparent text-white outline-none text-sm" />
        </Field>
        <div>
          <p className="text-white/40 text-xs mb-2">Frekans Peman</p>
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCES.map(([v, l]) => (
              <button key={v} onClick={() => upd('frequence', v)}
                className="glass rounded-xl py-2.5 text-center text-xs font-bold transition-all border"
                style={form.frequence === v
                  ? { borderColor:'rgba(168,85,247,.5)', background:'rgba(168,85,247,.2)', color:'#C084FC' }
                  : { borderColor:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.4)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── SECTION: Finans ── */}
      <Card title="Finans">
        {/* Montant — locked */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5" style={{ background:'rgba(255,255,255,.03)' }}>
          <Coins size={14} className="text-white/20 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-white/25 text-xs">Montan Pa Peryòd (fijè — pa ka chanje)</div>
            <div className="text-white/40 font-bold text-sm">{fmtMontan(sol.montant, sol.devis)}</div>
          </div>
          <span className="text-white/20 text-xs">🔒</span>
        </div>

        {/* Devis */}
        <div>
          <p className="text-white/40 text-xs mb-2">Devis</p>
          <div className="flex gap-2">
            {(['HTG','USD'] as Devis[]).map(d => (
              <button key={d} onClick={() => upd('devis', d)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border"
                style={form.devis === d
                  ? { borderColor:'rgba(168,85,247,.5)', background:'rgba(168,85,247,.2)', color:'#C084FC' }
                  : { borderColor:'rgba(255,255,255,.08)', background:'rgba(255,255,255,.03)', color:'rgba(255,255,255,.4)' }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* maxManm */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm flex items-center gap-1.5">
              <Users size={13} style={{ color:'#A855F7' }}/> Limit Manm
            </p>
            <p className="text-white/35 text-xs">Min aktyèl: {sol.manm.length} manm</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => upd('maxManm', Math.max(sol.manm.length, form.maxManm - 1))}
              className="glass w-9 h-9 rounded-xl flex items-center justify-center text-white/60 font-bold text-lg border border-white/8 hover:border-white/20 transition-colors">−</button>
            <span className="text-white font-black text-xl w-8 text-center">{form.maxManm}</span>
            <button onClick={() => upd('maxManm', form.maxManm + 1)}
              className="glass w-9 h-9 rounded-xl flex items-center justify-center text-white/60 font-bold text-lg border border-white/8 hover:border-white/20 transition-colors">+</button>
          </div>
        </div>
      </Card>

      {/* ── SECTION: Eta ── */}
      <Card title="Eta Sol La">
        {/* Status selector */}
        <div>
          <p className="text-white/40 text-xs mb-2">Estati</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map(([v, l, c]) => (
              <button key={v} onClick={() => upd('status', v)}
                className="py-3 rounded-xl text-sm font-bold transition-all border"
                style={form.status === v
                  ? { borderColor:`${c}55`, background:`${c}18`, color: c }
                  : { borderColor:'rgba(255,255,255,.08)', background:'rgba(255,255,255,.03)', color:'rgba(255,255,255,.35)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* peryòdAktif */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm flex items-center gap-1.5">
              <Calendar size={13} style={{ color:'#A855F7' }}/> Peryòd Aktyèl
            </p>
            <p className="text-white/35 text-xs">Avanse oswa bese peryòd la</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => upd('peryòdAktif', Math.max(1, form.peryòdAktif - 1))}
              className="glass w-9 h-9 rounded-xl flex items-center justify-center text-white/60 font-bold text-lg border border-white/8 hover:border-white/20 transition-colors">−</button>
            <span className="text-white font-black text-xl w-8 text-center">{form.peryòdAktif}</span>
            <button onClick={() => upd('peryòdAktif', Math.min(form.maxManm, form.peryòdAktif + 1))}
              className="glass w-9 h-9 rounded-xl flex items-center justify-center text-white/60 font-bold text-lg border border-white/8 hover:border-white/20 transition-colors">+</button>
          </div>
        </div>

        {/* tirajFèt toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-white font-semibold text-sm">Tiraj Fèt</p>
            <p className="text-white/35 text-xs">{form.tirajFèt ? 'Tiraj deja realize — pozisyon asiye' : 'Tiraj poko fèt — pozisyon poko asiye'}</p>
          </div>
          <button onClick={() => upd('tirajFèt', !form.tirajFèt)} className="transition-all flex-shrink-0">
            {form.tirajFèt
              ? <ToggleRight size={34} style={{ color:'#34D399' }} />
              : <ToggleLeft  size={34} style={{ color:'rgba(255,255,255,.2)' }} />
            }
          </button>
        </div>
      </Card>

      {/* ── Save ── */}
      <button onClick={save} disabled={saving}
        className="w-full candy-btn py-4 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
        <Save size={18}/> {saving ? 'Ap sove…' : 'Sove Tout Chanjman'}
      </button>

      {/* ── Danger zone (admin only) ── */}
      {user.role === 'admin' && (
        <div className="glass rounded-2xl border border-red-500/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-red-500/10 flex items-center gap-2">
            <AlertTriangle size={12} style={{ color:'#F87171' }} />
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider">Zòn Danje</p>
          </div>
          <div className="p-4">
            <AnimatePresence mode="wait">
              {!delConfirm ? (
                <motion.button key="btn" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  onClick={() => setDelConfirm(true)}
                  className="w-full py-3 rounded-xl text-red-400 font-bold text-sm border border-red-500/25 flex items-center justify-center gap-2 hover:bg-red-500/8 transition-colors glass">
                  <Trash2 size={16}/> Efase Sol Sa a Nèt
                </motion.button>
              ) : (
                <motion.div key="confirm" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-3">
                  <div className="text-center space-y-1">
                    <p className="text-red-400 font-bold text-sm">⚠️ Ou sèten ou vle efase?</p>
                    <p className="text-white/40 text-xs">Tout done sol la (manm, peman, tiraj, notifikasyon) ap efase pou toujou. Aksyon sa a pa ka anile.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setDelConfirm(false)}
                      className="flex-1 glass py-3 rounded-xl text-white/50 font-semibold border border-white/15 text-sm flex items-center justify-center gap-1.5">
                      <X size={14}/> Anile
                    </button>
                    <button onClick={deleteSol} disabled={deleting}
                      className="flex-[2] py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                      style={{ background:'linear-gradient(135deg,#EF4444,#DC2626)', boxShadow:'0 4px 12px rgba(239,68,68,.4)' }}>
                      <Trash2 size={14}/> {deleting ? 'Ap efase…' : 'Wi, Efase Pou Toujou'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-white/8 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8">
        <p className="text-white/60 text-xs font-bold uppercase tracking-wider">{title}</p>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-white/40 text-xs mb-1.5">{label}</p>
      <div className="glass rounded-xl px-3 py-2.5 border border-white/8 focus-within:border-purple-500/40 transition-colors">
        {children}
      </div>
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
