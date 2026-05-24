'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCookie, getInitials, fmtDate } from '@/lib/utils'
import type { PublicUser } from '@/lib/types'

const COLORS = ['#FF3DA0','#A855F7','#38BDF8','#34D399','#FCD34D','#FB923C']
const ROLE_LABEL: Record<string,string> = { admin:'Admin', chef:'Chef', manm:'Manm' }
const ROLE_COLOR: Record<string,string> = { admin:'#FF3DA0', chef:'#A855F7', manm:'#38BDF8' }

export default function ManmListPage() {
  const { user, loading } = useAuth()
  const [users, setUsers] = useState<PublicUser[]>([])
  const [q, setQ]         = useState('')

  useEffect(() => {
    const token = getCookie('sol_token')
    if (!token) return
    fetch(`/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setUsers(d.users || []))
  }, [])

  useEffect(() => {
    const token = getCookie('sol_token')
    if (!token || q.length < 2) return
    const t = setTimeout(() => {
      fetch(`/api/users?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setUsers(d.users || []))
    }, 400)
    return () => clearTimeout(t)
  }, [q])

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid rgba(168,85,247,.2)', borderTopColor:'#A855F7', animation:'spin-slow 1s linear infinite' }} />
    </div>
  )

  if (user.role === 'manm') return (
    <div className="text-center py-20 text-white/50">Pa gen aksè.</div>
  )

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Manm Yo</h1>
          <p className="text-white/50 text-xs">{users.length} itilizatè</p>
        </div>
        <div style={{
          width:44, height:44, borderRadius:14,
          background:'linear-gradient(135deg,#A855F7,#38BDF8)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 16px rgba(168,85,247,.5)',
        }}>
          <Users size={22} style={{ color:'white' }} />
        </div>
      </div>

      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/8">
        <Search size={16} className="text-white/40" />
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Chèche manm…"
          className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm" />
      </div>

      <div className="space-y-2">
        {users.map((u, i) => (
          <motion.div key={u.id}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: i*.04 }}
            className="glass rounded-2xl p-3.5 flex items-center gap-3 border border-white/8">
            <div style={{
              width:44, height:44, borderRadius:'50%', flexShrink:0,
              background:`linear-gradient(135deg,${COLORS[i%COLORS.length]},${COLORS[(i+1)%COLORS.length]})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:15, fontWeight:'bold', color:'white',
              boxShadow:`0 4px 12px ${COLORS[i%COLORS.length]}44`,
            }}>
              {getInitials(u.prenom, u.nom)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm truncate">{u.prenom} {u.nom}</div>
              <div className="text-white/40 text-xs">{u.telefon} • Manm depi {fmtDate(u.createdAt)}</div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ color:ROLE_COLOR[u.role]??'#A855F7', background:`${ROLE_COLOR[u.role]??'#A855F7'}18`, border:`1px solid ${ROLE_COLOR[u.role]??'#A855F7'}33` }}>
              {ROLE_LABEL[u.role]??u.role}
            </span>
          </motion.div>
        ))}
        {users.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center border border-white/8">
            <Users size={36} className="mx-auto mb-3 text-white/20" />
            <p className="text-white/40 text-sm">Pa gen manm pou montre.</p>
          </div>
        )}
      </div>
    </div>
  )
}
