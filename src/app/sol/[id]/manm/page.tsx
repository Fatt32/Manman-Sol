'use client'

import { useState, useEffect, use, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import {
  ArrowLeft, UserPlus, Trash2, Users, Phone, User,
  Pencil, Check, X, Lock, GripVertical, Save, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCookie, getInitials } from '@/lib/utils'
import type { Sol, SolManm, ToucheRecord } from '@/lib/types'

const COLORS = ['#FF3DA0','#A855F7','#38BDF8','#34D399','#FCD34D','#FB923C']

type AddMode = 'nouvo' | 'egziste'
interface NewForm  { prenom:string; nom:string; telefon:string }
interface EditState { entryId:string; prenom:string; nom:string; telefon:string }

/* ── helper: build ordered list from sol.manm ─────────────────────── */
function toOrdered(manm: SolManm[]): SolManm[] {
  const withPos    = manm.filter(m => m.pozisyon > 0).sort((a,b) => a.pozisyon - b.pozisyon)
  const withoutPos = manm.filter(m => m.pozisyon === 0)
  return [...withPos, ...withoutPos]
}

/* ══════════════════════════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════════════════════════ */
export default function ManmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params)
  const { user, loading } = useAuth()
  const [sol, setSol]     = useState<Sol | null>(null)
  const [lockedUserIds, setLockedUserIds] = useState<Set<string>>(new Set())
  const [msg, setMsg]     = useState<{ text:string; ok:boolean } | null>(null)

  /* drag-and-drop order */
  const [items, setItems]           = useState<SolManm[]>([])
  const [orderChanged, setOrderChanged] = useState(false)
  const [savingOrder, setSavingOrder]   = useState(false)

  /* add form */
  const [showAdd, setShowAdd] = useState(false)
  const [addMode, setAddMode] = useState<AddMode>('nouvo')
  const [adding, setAdding]   = useState(false)
  const [newForm, setNewForm] = useState<NewForm>({ prenom:'', nom:'', telefon:'' })
  const [tempPassMap, setTempPassMap] = useState<Record<string,string>>({})

  /* edit / remove */
  const [editState, setEditState]       = useState<EditState | null>(null)
  const [saving, setSaving]             = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [removing, setRemoving]         = useState(false)

  const token = getCookie('sol_token')
  const authH = { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }

  const applySol = useCallback((s: Sol) => {
    setSol(s)
    setItems(toOrdered(s.manm))
    setOrderChanged(false)
  }, [])

  useEffect(() => {
    if (!token) return
    const h = { Authorization:`Bearer ${token}` }
    Promise.all([
      fetch(`/api/sol/${id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/sol/${id}/touche`, { headers: h }).then(r => r.json()),
    ]).then(([solD, toucheD]) => {
      if (solD.sol) applySol(solD.sol)
      if (toucheD.records) {
        const konfime = new Set<string>(
          (toucheD.records as ToucheRecord[])
            .filter(r => r.status === 'konfime')
            .map(r => r.userId)
        )
        setLockedUserIds(konfime)
      }
    })
  }, [id, token, applySol])

  function flash(text:string, ok=true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3500)
  }

  /* ── drag reorder ── */
  function handleReorder(newOrder: SolManm[]) {
    setItems(newOrder)
    setOrderChanged(true)
  }

  async function saveOrder() {
    if (!sol) return
    setSavingOrder(true)
    const reassigned = items.map((m, i) => ({ ...m, pozisyon: i + 1 }))
    const res = await fetch(`/api/sol/${id}`, {
      method:'PUT', headers: authH,
      body: JSON.stringify({ manm: reassigned }),
    })
    const data = await res.json()
    if (res.ok) { applySol(data.sol); flash('Lòd plas yo sove!') }
    else flash(data.error || 'Erè', false)
    setSavingOrder(false)
  }

  /* ── add new person ── */
  async function addNouvo(e: React.FormEvent) {
    e.preventDefault(); setAdding(true)
    try {
      const res = await fetch(`/api/sol/${id}/manm`, {
        method:'POST', headers: authH,
        body: JSON.stringify(newForm),
      })
      const data = await res.json()
      if (!res.ok) { flash(data.error || 'Erè', false); return }
      if (data.tempPassword) setTempPassMap(m => ({...m, [newForm.telefon]: data.tempPassword}))
      flash(data.message || 'Plas ajoute!')
      setNewForm({ prenom:'', nom:'', telefon:'' })
      applySol(data.sol)
    } catch { flash('Erè rezo', false) }
    finally { setAdding(false) }
  }

  /* ── add extra slot for existing member ── */
  async function addExisting(m: SolManm) {
    setAdding(true)
    try {
      const res = await fetch(`/api/sol/${id}/manm`, {
        method:'POST', headers: authH,
        body: JSON.stringify({ userId: m.userId }),
      })
      const data = await res.json()
      if (!res.ok) { flash(data.error || 'Erè', false); return }
      flash(`Plas anplis ajoute pou ${m.prenom} ${m.nom}!`)
      applySol(data.sol)
    } catch { flash('Erè rezo', false) }
    finally { setAdding(false) }
  }

  /* ── edit ── */
  function startEdit(m: SolManm) {
    setEditState({ entryId:m.entryId, prenom:m.prenom, nom:m.nom, telefon:m.telefon })
    setConfirmRemove(null)
  }

  async function saveEdit() {
    if (!editState || !sol) return
    setSaving(true)
    const updatedManm = sol.manm.map(m =>
      m.entryId === editState.entryId
        ? { ...m, prenom:editState.prenom, nom:editState.nom, telefon:editState.telefon }
        : m
    )
    const res = await fetch(`/api/sol/${id}`, {
      method:'PUT', headers: authH,
      body: JSON.stringify({ manm: updatedManm }),
    })
    const data = await res.json()
    if (res.ok) { applySol(data.sol); setEditState(null); flash('Manm modifye!') }
    else flash(data.error || 'Erè', false)
    setSaving(false)
  }

  /* ── remove ── */
  async function removeManm(entryId: string) {
    setRemoving(true)
    const res = await fetch(`/api/sol/${id}/manm`, {
      method:'DELETE', headers: authH,
      body: JSON.stringify({ entryId }),
    })
    const data = await res.json()
    if (res.ok) { applySol(data.sol); flash('Plas retire'); setConfirmRemove(null) }
    else flash(data.error || 'Erè', false)
    setRemoving(false)
  }

  /* ── derived (hooks must come before any early return) ── */
  const uniqueInSol = useMemo(() => {
    const seen = new Set<string>()
    return (sol?.manm ?? []).filter(m => { if (seen.has(m.userId)) return false; seen.add(m.userId); return true })
  }, [sol?.manm])

  /* ── render ── */
  if (loading || !user) return null
  if (!sol) return <Loader />

  const isChef = sol.chefId === user.id || user.role === 'admin'
  if (!isChef) return <div className="text-center py-20 text-white/50">Ou pa gen aksè.</div>

  const isFull = sol.manm.length >= sol.maxManm

  return (
    <div className="max-w-md lg:max-w-3xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/sol/${id}`} className="glass p-2 rounded-xl text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">Jere Plas Yo</h1>
          <p className="text-white/40 text-xs">{sol.nom} • {sol.manm.length}/{sol.maxManm} plas okipe</p>
        </div>
        {!isFull ? (
          <button onClick={() => { setShowAdd(s => !s); setEditState(null) }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${showAdd ? 'glass border border-white/15 text-white/60' : 'candy-btn text-white'}`}>
            {showAdd ? <X size={16}/> : <UserPlus size={16}/>}
            {showAdd ? 'Fèmen' : 'Ajoute'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-red-500/30 text-red-400 text-xs font-bold">
            <Lock size={13}/> Plen
          </div>
        )}
      </div>

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

      {/* ── Add panel ── */}
      <AnimatePresence>
        {showAdd && !isFull && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }} className="overflow-hidden">
            <div className="glass rounded-2xl p-4 border border-purple-500/20 space-y-3">

              {/* Mode toggle */}
              <div className="flex gap-2">
                {(['nouvo','egziste'] as const).map(mode => (
                  <button key={mode} onClick={() => setAddMode(mode)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={addMode===mode
                      ? { background:'rgba(168,85,247,.25)', color:'#C084FC', border:'1px solid rgba(168,85,247,.4)' }
                      : { background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.4)', border:'1px solid rgba(255,255,255,.08)' }}>
                    {mode==='nouvo' ? '+ Nouvo Moun' : '↩ Manm Deja Nan Sol'}
                  </button>
                ))}
              </div>

              {/* ── Mode A: new person ── */}
              {addMode === 'nouvo' ? (
                <form onSubmit={addNouvo} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <InputRow icon={User} placeholder="Prenon" value={newForm.prenom} onChange={v => setNewForm(f=>({...f,prenom:v}))} />
                    <InputRow icon={User} placeholder="Siyati"  value={newForm.nom}    onChange={v => setNewForm(f=>({...f,nom:v}))}    />
                  </div>
                  <InputRow icon={Phone} type="tel" placeholder="Telefòn (509…)" value={newForm.telefon} onChange={v => setNewForm(f=>({...f,telefon:v}))} />
                  <p className="text-white/25 text-xs">Plas la ap ajoute nan fen lis la. Glise li nan bon kote apre.</p>
                  <button type="submit" disabled={adding || !newForm.prenom || !newForm.nom || !newForm.telefon}
                    className="candy-btn w-full py-3 text-white font-bold text-sm rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
                    <UserPlus size={16}/> {adding ? 'Ap ajoute…' : 'Ajoute Moun Nouvo'}
                  </button>
                </form>
              ) : (
                /* ── Mode B: existing member gets extra slot ── */
                <div className="space-y-2">
                  <p className="text-white/40 text-xs">Chwazi yon manm pou ba li yon plas anplis:</p>
                  {uniqueInSol.length === 0 ? (
                    <p className="text-white/30 text-xs text-center py-4">Pa gen manm nan sol la.</p>
                  ) : uniqueInSol.map((m, i) => {
                    const slotCount = sol.manm.filter(s => s.userId === m.userId).length
                    const color = COLORS[i % COLORS.length]
                    return (
                      <button key={m.userId} onClick={() => addExisting(m)} disabled={adding}
                        className="w-full glass rounded-xl p-3 flex items-center gap-3 border border-white/8 hover:border-purple-500/30 transition-all disabled:opacity-50 text-left">
                        <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${color},${COLORS[(i+1)%COLORS.length]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:'bold', color:'white', flexShrink:0 }}>
                          {getInitials(m.prenom, m.nom)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold text-sm">{m.prenom} {m.nom}</div>
                          <div className="text-white/40 text-xs">{slotCount} plas deja</div>
                        </div>
                        <ChevronRight size={16} className="text-white/30 flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Temp passwords */}
      {Object.keys(tempPassMap).length > 0 && (
        <div className="glass rounded-2xl p-4 border border-yellow-500/20 space-y-2">
          <p className="text-yellow-400 text-xs font-bold">🔑 Modpas Pwovizoua Kreye</p>
          {Object.entries(tempPassMap).map(([tel, pass]) => (
            <div key={tel} className="flex justify-between text-xs">
              <span className="text-white/50">{tel}</span>
              <span className="text-yellow-300 font-bold tracking-widest">{pass}</span>
            </div>
          ))}
          <p className="text-white/30 text-xs">Di manm yo chanje modpas yo aprè koneksyon.</p>
        </div>
      )}

      {/* ── Save order CTA ── */}
      <AnimatePresence>
        {orderChanged && (
          <motion.button initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
            onClick={saveOrder} disabled={savingOrder}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background:'linear-gradient(135deg,#34D399,#059669)', boxShadow:'0 6px 20px rgba(52,211,153,.4)' }}>
            <Save size={16}/> {savingOrder ? 'Ap sove lòd…' : 'Sove Nouvo Lòd Plas Yo'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Draggable list ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Users size={12}/> {sol.manm.length} Plas • {sol.maxManm - sol.manm.length} Lib
          </p>
          {items.length > 0 && !orderChanged && (
            <span className="text-white/20 text-xs flex items-center gap-1">
              <GripVertical size={12}/> glise pou ranje lòd
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center border border-white/8">
            <Users size={32} className="mx-auto mb-3 text-white/20" />
            <p className="text-white/40 text-sm">Pa gen plas pou kounyela.</p>
            {!isFull && (
              <button onClick={() => setShowAdd(true)} className="mt-4 candy-btn px-5 py-2.5 text-white font-bold text-sm rounded-full">
                Ajoute Premye Plas
              </button>
            )}
          </div>
        ) : (
          <Reorder.Group axis="y" values={items} onReorder={handleReorder}
            style={{ listStyle:'none', padding:0, margin:0 }}>
            {items.map((m, i) => (
              <ManmRow key={m.entryId} m={m} index={i}
                isLocked={lockedUserIds.has(m.userId)}
                isEditing={editState?.entryId === m.entryId}
                isRemoving={confirmRemove === m.entryId}
                editState={editState}
                saving={saving}
                removing={removing}
                onStartEdit={() => { startEdit(m); setConfirmRemove(null) }}
                onCancelEdit={() => setEditState(null)}
                onSaveEdit={saveEdit}
                onEditChange={patch => setEditState(s => s && ({...s,...patch}))}
                onStartRemove={() => { setConfirmRemove(m.entryId); setEditState(null) }}
                onCancelRemove={() => setConfirmRemove(null)}
                onConfirmRemove={() => removeManm(m.entryId)}
              />
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   ManmRow — individual draggable slot card
   ══════════════════════════════════════════════════════════════════════ */
interface RowProps {
  m: SolManm; index: number
  isLocked: boolean
  isEditing: boolean; isRemoving: boolean
  editState: { entryId:string; prenom:string; nom:string; telefon:string } | null
  saving: boolean; removing: boolean
  onStartEdit(): void; onCancelEdit(): void; onSaveEdit(): void
  onEditChange(patch: Partial<{prenom:string;nom:string;telefon:string}>): void
  onStartRemove(): void; onCancelRemove(): void; onConfirmRemove(): void
}

function ManmRow({ m, index, isLocked, isEditing, isRemoving, editState, saving, removing,
  onStartEdit, onCancelEdit, onSaveEdit, onEditChange, onStartRemove, onCancelRemove, onConfirmRemove }: RowProps) {
  const controls = useDragControls()
  const color    = isLocked ? '#38BDF8' : COLORS[index % COLORS.length]
  const nextColor = isLocked ? '#0EA5E9' : COLORS[(index + 1) % COLORS.length]

  return (
    <Reorder.Item value={m} dragControls={controls} dragListener={false}
      className="mb-2"
      style={{ listStyle:'none' }}
      whileDrag={{ scale:1.02, zIndex:50, boxShadow:'0 12px 32px rgba(0,0,0,.6)', borderRadius:16 }}>

      <div className={`glass rounded-2xl border transition-colors ${isLocked ? 'border-blue-400/20' : isEditing ? 'border-purple-500/40' : isRemoving ? 'border-red-500/30' : 'border-white/8'}`}
        style={{ opacity: isLocked ? 0.85 : 1 }}>

        {/* Main row */}
        <div className="p-3 flex items-center gap-2.5">

          {/* Drag grip + position badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0"
            onPointerDown={e => { if (!isLocked) controls.start(e) }}
            style={{ cursor: isLocked ? 'default' : 'grab', touchAction:'none', userSelect:'none' }}>
            {isLocked
              ? <Lock size={14} style={{ color:'#38BDF8', opacity:.6 }} />
              : <GripVertical size={16} style={{ color:'rgba(255,255,255,.2)' }} />
            }
            <div style={{
              width:26, height:26, borderRadius:'50%',
              background:`linear-gradient(135deg,${color},${nextColor})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:isLocked ? 11 : 10, fontWeight:'bold', color:'white',
              boxShadow:`0 2px 8px ${color}55`, flexShrink:0,
            }}>{isLocked ? '✓' : index + 1}</div>
          </div>

          {/* Avatar */}
          <div style={{ width:38, height:38, borderRadius:'50%', background:`${color}1a`, border:`1.5px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:'bold', color, flexShrink:0 }}>
            {getInitials(m.prenom, m.nom)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm truncate flex items-center gap-1.5">
              {m.prenom} {m.nom}
              {isLocked && <span className="text-xs font-normal px-1.5 py-0.5 rounded-full" style={{ background:'rgba(56,189,248,.12)', color:'#38BDF8', border:'1px solid rgba(56,189,248,.25)' }}>Touche ✓</span>}
            </div>
            <div className="text-white/40 text-xs truncate">{m.telefon || '—'}</div>
          </div>

          {/* Action buttons */}
          {isLocked ? (
            <div className="flex items-center gap-1 px-2" title="Manm sa deja touche — pa ka modifye">
              <Lock size={14} style={{ color:'rgba(56,189,248,.4)' }} />
            </div>
          ) : (
            <div className="flex items-center gap-0.5" onPointerDown={e => e.stopPropagation()}>
              <button onClick={isEditing ? onCancelEdit : onStartEdit}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                style={{ color: isEditing ? '#C084FC' : 'rgba(255,255,255,.35)' }}>
                {isEditing ? <X size={15}/> : <Pencil size={15}/>}
              </button>
              <button onClick={isRemoving ? onCancelRemove : onStartRemove}
                className="p-2 rounded-xl hover:bg-red-500/10 transition-colors"
                style={{ color: isRemoving ? '#F87171' : 'rgba(255,255,255,.25)' }}>
                <Trash2 size={15}/>
              </button>
            </div>
          )}
        </div>

        {/* Edit panel — only shown for non-locked members */}
        <AnimatePresence>
          {!isLocked && isEditing && editState && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
              exit={{ height:0, opacity:0 }} transition={{ duration:.2 }} className="overflow-hidden">
              <div className="px-4 pb-4 space-y-2 border-t border-white/8 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <InputRow icon={User} placeholder="Prenon" value={editState.prenom} onChange={v => onEditChange({prenom:v})} small />
                  <InputRow icon={User} placeholder="Siyati"  value={editState.nom}    onChange={v => onEditChange({nom:v})}    small />
                </div>
                <InputRow icon={Phone} type="tel" placeholder="Telefòn" value={editState.telefon} onChange={v => onEditChange({telefon:v})} small />
                <div className="flex gap-2 pt-1">
                  <button onClick={onCancelEdit} className="flex-1 glass py-2.5 rounded-xl text-white/50 text-sm border border-white/15 font-semibold">Anile</button>
                  <button onClick={onSaveEdit} disabled={saving}
                    className="flex-[2] candy-btn py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
                    <Check size={15}/> {saving ? 'Ap sove…' : 'Sove Chanjman'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Remove confirm — only shown for non-locked members */}
        <AnimatePresence>
          {!isLocked && isRemoving && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
              exit={{ height:0, opacity:0 }} transition={{ duration:.2 }} className="overflow-hidden">
              <div className="px-4 pb-4 border-t border-red-500/20 pt-3 space-y-2">
                <p className="text-red-400/80 text-sm text-center">
                  Retire plas #{index + 1} — <strong>{m.prenom} {m.nom}</strong>?
                </p>
                <div className="flex gap-2">
                  <button onClick={onCancelRemove} className="flex-1 glass py-2.5 rounded-xl text-white/50 text-sm border border-white/15 font-semibold">Non</button>
                  <button onClick={onConfirmRemove} disabled={removing}
                    className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                    style={{ background:'linear-gradient(135deg,#EF4444,#DC2626)', boxShadow:'0 4px 12px rgba(239,68,68,.4)' }}>
                    {removing ? 'Ap retire…' : 'Wi, Retire'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  )
}

/* ── Input helper ─────────────────────────────────────────────────── */
function InputRow({ icon:Icon, placeholder, value, onChange, type='text', small=false }:
  { icon:React.ComponentType<{size?:number;className?:string}>; placeholder:string; value:string; onChange:(v:string)=>void; type?:string; small?:boolean }) {
  return (
    <div className={`glass rounded-xl flex items-center gap-2 border border-white/8 focus-within:border-purple-500/40 ${small ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}>
      <Icon size={small ? 13 : 15} className="text-white/40 flex-shrink-0" />
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`flex-1 bg-transparent text-white placeholder-white/30 outline-none ${small ? 'text-xs' : 'text-sm'}`} />
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
