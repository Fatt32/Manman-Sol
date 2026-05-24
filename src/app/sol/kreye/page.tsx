'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Coins, Users, Calendar, FileText, UserPlus, Trash2, Check, Phone, User } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getCookie, getInitials } from '@/lib/utils'

const COLORS = ['#FF3DA0','#A855F7','#38BDF8','#34D399','#FCD34D','#FB923C']

interface ManmForm { prenom: string; nom: string; telefon: string; pozisyon: number }

export default function KreyeSolPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [step, setStep]   = useState(1) // 1=info, 2=finances, 3=manm
  const [solId, setSolId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr]     = useState('')
  const [addedManm, setAddedManm] = useState<(ManmForm & { tempPass?: string })[]>([])

  const [form, setForm] = useState({
    nom:'', description:'',
    montant:'', devis:'HTG',
    frequence:'chak-mwa',
    maxManm:'', dateDebut: new Date().toISOString().slice(0,10),
  })

  const [newManm, setNewManm] = useState<ManmForm>({ prenom:'', nom:'', telefon:'', pozisyon:0 })
  const [addingManm, setAddingManm] = useState(false)
  const [addMsg, setAddMsg] = useState('')

  function upd(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function createSol() {
    setErr(''); setSubmitting(true)
    try {
      const token = getCookie('sol_token')
      const res = await fetch('/api/sol', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ ...form, montant:Number(form.montant), maxManm:Number(form.maxManm) }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Erè'); return }
      setSolId(data.sol.id)
      setStep(3)
    } catch { setErr('Erè rezo') }
    finally { setSubmitting(false) }
  }

  async function addManm() {
    if (!solId || !newManm.prenom || !newManm.nom || !newManm.telefon) return
    setAddingManm(true); setAddMsg('')
    try {
      const token = getCookie('sol_token')
      const res = await fetch(`/api/sol/${solId}/manm`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ prenom:newManm.prenom, nom:newManm.nom, telefon:newManm.telefon, pozisyon:newManm.pozisyon || 0 }),
      })
      const data = await res.json()
      if (!res.ok) { setAddMsg(data.error); return }
      setAddedManm(m => [...m, { ...newManm, tempPass: data.tempPassword || undefined }])
      setAddMsg(data.message)
      setNewManm({ prenom:'', nom:'', telefon:'', pozisyon:0 })
    } catch { setAddMsg('Erè rezo') }
    finally { setAddingManm(false) }
  }

  if (loading || !user) return null
  if (user.role === 'manm') return (
    <div className="flex items-center justify-center min-h-[60vh] text-center px-6">
      <div><div className="text-5xl mb-4">🔒</div><p className="text-white/60">Sèlman admin ak chef ka kreye sol.</p></div>
    </div>
  )

  const STEPS = ['Enfòmasyon', 'Finansye', 'Manm yo']

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        {step > 1 && step < 3 ? (
          <button onClick={() => setStep(s => s-1 as 1|2|3)} className="glass p-2 rounded-xl text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <Link href="/sol" className="glass p-2 rounded-xl text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
        )}
        <div>
          <h1 className="text-xl font-black text-white">Kreye Sol</h1>
          <p className="text-white/40 text-xs">Etap {step} / 3 — {STEPS[step-1]}</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 space-y-1">
            <div className="h-1.5 rounded-full transition-all"
              style={{ background: i+1 <= step ? 'linear-gradient(90deg,#FF3DA0,#A855F7)' : 'rgba(255,255,255,.1)' }} />
            <p className="text-center text-xs font-semibold" style={{ color: i+1 <= step ? '#C084FC' : 'rgba(255,255,255,.3)' }}>{label}</p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 1: General Info ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-4">
            <Field label="Non Sol La" icon={FileText}>
              <input value={form.nom} onChange={e => upd('nom',e.target.value)} placeholder="Ex: Sol Fanmi, Sol Travay…" required
                className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base" />
            </Field>
            <div>
              <label className="text-xs text-white/50 font-semibold mb-1.5 block">Deskripsyon (opsyonèl)</label>
              <div className="glass rounded-2xl px-4 py-3 border border-white/8 focus-within:border-purple-500/50 transition-colors">
                <textarea value={form.description} onChange={e => upd('description',e.target.value)}
                  placeholder="Dekri bi sol la…" rows={2}
                  className="w-full bg-transparent text-white placeholder-white/30 outline-none text-sm resize-none" />
              </div>
            </div>
            <Field label="Konbyen Manm?" icon={Users}>
              <input type="number" value={form.maxManm} onChange={e => upd('maxManm',e.target.value)}
                placeholder="Ex: 10" min="2" max="50" required
                className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base" />
            </Field>
            <button onClick={() => { if(form.nom && form.maxManm) setStep(2) }}
              disabled={!form.nom || !form.maxManm}
              className="candy-btn w-full py-4 text-white font-bold text-base rounded-full disabled:opacity-40">
              Kontinye → Finansye
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Financial ── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-4">
            <div>
              <label className="text-xs text-white/50 font-semibold mb-1.5 block">Konbyen Lajan Pa Peryòd</label>
              <div className="flex gap-2">
                <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/8 flex-1 focus-within:border-purple-500/50 transition-colors">
                  <Coins size={18} className="text-white/40" />
                  <input type="number" value={form.montant} onChange={e => upd('montant',e.target.value)}
                    placeholder="Ex: 5000" min="1" required
                    className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base" />
                </div>
                <div className="glass rounded-2xl border border-white/8 flex overflow-hidden">
                  {(['HTG','USD'] as const).map(d => (
                    <button key={d} onClick={() => upd('devis',d)}
                      className="px-4 py-3 text-sm font-bold transition-all"
                      style={form.devis===d ? { background:'rgba(168,85,247,.3)', color:'#C084FC' } : { color:'rgba(255,255,255,.4)' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 font-semibold mb-1.5 block">Frekans Peman</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['chak-semèn','Chak Semèn'],
                  ['de-semèn',  '15 Jou'],
                  ['chak-mwa',  'Chak Mwa'],
                  ['3-mwa',     '3 Mwa'],
                  ['6-mwa',     '6 Mwa'],
                  ['ane',       'Chak Ane'],
                ] as [string,string][]).map(([v,l]) => (
                  <button key={v} onClick={() => upd('frequence',v)}
                    className="glass rounded-xl p-3 text-center text-xs font-semibold transition-all border"
                    style={form.frequence===v
                      ? { borderColor:'rgba(168,85,247,.5)', background:'rgba(168,85,247,.2)', color:'#C084FC' }
                      : { borderColor:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.5)' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Dat Kòmansman" icon={Calendar}>
              <input type="date" value={form.dateDebut} onChange={e => upd('dateDebut',e.target.value)}
                className="flex-1 bg-transparent text-white outline-none text-base" />
            </Field>

            {/* Summary */}
            <div className="glass rounded-2xl p-4 border border-purple-500/20 space-y-2">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Rezime Sol la</p>
              {[
                ['Non', form.nom],
                ['Manm', form.maxManm + ' moun'],
                ['Pa peryòd', form.montant ? `${form.montant} ${form.devis}` : '—'],
                ['Frekans', form.frequence],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-white/40">{k}</span>
                  <span className="text-white font-semibold">{v}</span>
                </div>
              ))}
              {form.montant && form.maxManm && (
                <div className="flex justify-between text-sm border-t border-white/8 pt-2">
                  <span className="text-white/40">Sak Total</span>
                  <span className="font-black" style={{ color:'#34D399' }}>
                    {(Number(form.montant)*Number(form.maxManm)).toLocaleString()} {form.devis}
                  </span>
                </div>
              )}
            </div>

            {err && <p className="text-red-400 text-sm text-center">{err}</p>}
            <button onClick={createSol} disabled={submitting || !form.montant}
              className="candy-btn w-full py-4 text-white font-bold text-base rounded-full disabled:opacity-40">
              {submitting ? 'Ap kreye…' : 'Kreye Sol → Ajoute Manm'}
            </button>
          </motion.div>
        )}

        {/* ── Step 3: Add members ── */}
        {step === 3 && solId && (
          <motion.div key="s3" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-4">
            <div className="glass rounded-2xl p-4 border border-green-500/20 flex items-start gap-3">
              <Check size={20} style={{ color:'#34D399', flexShrink:0, marginTop:1 }} />
              <div>
                <p className="text-white font-bold text-sm">Sol "{form.nom}" kreye!</p>
                <p className="text-white/50 text-xs mt-0.5">Kounye a ajoute manm yo. Sistèm nan ap kreye yon kont otomatikman pou chak moun.</p>
              </div>
            </div>

            {/* Add member form */}
            <div className="glass rounded-2xl p-4 border border-white/8 space-y-3">
              <p className="text-white/60 text-sm font-bold">Ajoute Yon Manm</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 border border-white/8 focus-within:border-purple-500/40">
                  <User size={14} className="text-white/40" />
                  <input value={newManm.prenom} onChange={e => setNewManm(m => ({...m, prenom:e.target.value}))}
                    placeholder="Prenon" className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm" />
                </div>
                <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 border border-white/8 focus-within:border-purple-500/40">
                  <User size={14} className="text-white/40" />
                  <input value={newManm.nom} onChange={e => setNewManm(m => ({...m, nom:e.target.value}))}
                    placeholder="Siyati" className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm" />
                </div>
              </div>
              <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 border border-white/8 focus-within:border-purple-500/40">
                <Phone size={14} className="text-white/40" />
                <input type="tel" value={newManm.telefon} onChange={e => setNewManm(m => ({...m, telefon:e.target.value}))}
                  placeholder="Nimewo telefòn (509…)" className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm" />
              </div>
              <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 border border-white/8 focus-within:border-purple-500/40">
                <span className="text-white/40 text-xs font-bold">#</span>
                <input type="number" value={newManm.pozisyon || ''} onChange={e => setNewManm(m => ({...m, pozisyon:Number(e.target.value)}))}
                  placeholder={`Pozisyon (1-${form.maxManm}) — 0 = tiraj`} min={0} max={Number(form.maxManm)}
                  className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm" />
              </div>

              {addMsg && (
                <p className={`text-xs text-center px-2 ${addMsg.includes('Erè') || addMsg.includes('deja') ? 'text-red-400' : 'text-green-400'}`}>
                  {addMsg}
                </p>
              )}

              <button onClick={addManm} disabled={addingManm || !newManm.prenom || !newManm.nom || !newManm.telefon}
                className="candy-btn w-full py-3 text-white font-bold text-sm rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
                <UserPlus size={18} /> {addingManm ? 'Ap ajoute…' : 'Ajoute Manm'}
              </button>
            </div>

            {/* Added members list */}
            {addedManm.length > 0 && (
              <div className="space-y-2">
                <p className="text-white/50 text-xs font-bold uppercase tracking-wider">{addedManm.length}/{form.maxManm} Manm Ajoute</p>
                {addedManm.map((m, i) => (
                  <div key={i} className="glass rounded-xl p-3 flex items-center gap-3 border border-white/8">
                    <div style={{
                      width:36, height:36, borderRadius:'50%', flexShrink:0,
                      background:`linear-gradient(135deg,${COLORS[i%COLORS.length]},${COLORS[(i+1)%COLORS.length]})`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:12, fontWeight:'bold', color:'white',
                    }}>
                      {getInitials(m.prenom, m.nom)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm truncate">{m.prenom} {m.nom}</div>
                      <div className="text-white/40 text-xs">{m.telefon}
                        {m.tempPass && <span className="text-yellow-400 ml-2">🔑 Modpas: <strong>{m.tempPass}</strong></span>}
                      </div>
                    </div>
                    {m.pozisyon > 0 && (
                      <div className="glass px-2 py-0.5 rounded-full text-xs font-bold text-purple-400 border border-purple-500/30">#{m.pozisyon}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Temporary passwords notice */}
            {addedManm.some(m => m.tempPass) && (
              <div className="glass rounded-2xl p-4 border border-yellow-500/20 space-y-1">
                <p className="text-yellow-400 text-xs font-bold">⚠️ Modpas Pwovizoua</p>
                <p className="text-white/50 text-xs">Kont yo kreye otomatikman. Modpas chak moun se <strong>4 dènye chif telefòn yo</strong>. Di yo chanje l aprè yo konekte.</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => router.push(`/sol/${solId}`)}
                className="flex-1 glass py-4 text-white/70 font-bold rounded-full border border-white/15 text-sm">
                Fini pita
              </button>
              <button onClick={() => router.push(`/sol/${solId}/tiraj`)}
                className="flex-[2] candy-btn-pink py-4 text-white font-bold text-base rounded-full">
                Fè Tiraj Osò! 🎲
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ label, icon:Icon, children }: { label:string; icon:React.ComponentType<{size?:number;className?:string}>; children:React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-white/50 font-semibold mb-1.5 block">{label}</label>
      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/8 focus-within:border-purple-500/50 transition-colors">
        <Icon size={18} className="text-white/40 flex-shrink-0" />
        {children}
      </div>
    </div>
  )
}
