'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Crown, CheckCircle, AlertCircle, Coins, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCookie, AUTH_COOKIE, fmtDate } from '@/lib/utils'
import type { Notification } from '@/lib/types'

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{size?:number;style?:React.CSSProperties}>, color: string, bg: string }> = {
  'pre-touche':    { icon: Crown,        color: '#FCD34D', bg: 'rgba(252,211,77,.1)'  },
  'jou-touche':    { icon: Coins,        color: '#34D399', bg: 'rgba(52,211,153,.1)'  },
  'konfime-touche':{ icon: CheckCircle,  color: '#38BDF8', bg: 'rgba(56,189,248,.1)'  },
  'demande-peman': { icon: AlertCircle,  color: '#FB923C', bg: 'rgba(251,146,60,.1)'  },
  'peman-resevwa': { icon: Coins,        color: '#A855F7', bg: 'rgba(168,85,247,.1)'  },
}

export default function NotifPage() {
  const { user, loading } = useAuth()
  const [notifs, setNotifs]     = useState<Notification[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const token = getCookie(AUTH_COOKIE)
    if (!token) return
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => setNotifs(d.notifs || []))
      .finally(() => setFetching(false))
  }, [])

  async function markAllRead() {
    const token = getCookie(AUTH_COOKIE)
    if (!token) return
    await fetch('/api/notifications', {
      method:'PUT', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({}),
    })
    setNotifs(n => n.map(x => ({ ...x, li: true })))
  }

  if (loading || !user) return null

  const unread = notifs.filter(n => !n.li).length

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Notifikasyon</h1>
          <p className="text-white/40 text-xs">{unread} ki poko li</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="glass px-3 py-2 rounded-xl text-xs font-bold text-purple-400 border border-purple-500/30 flex items-center gap-1.5 hover:bg-purple-500/10 transition-colors">
            <Check size={14} /> Mak tout li
          </button>
        )}
      </div>

      {fetching ? (
        <div className="flex justify-center py-12">
          <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid rgba(168,85,247,.2)', borderTopColor:'#A855F7', animation:'spin-slow 1s linear infinite' }} />
        </div>
      ) : notifs.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-white/8">
          <Bell size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40 text-sm">Pa gen notifikasyon.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n, i) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG['pre-touche']
            const Icon = cfg.icon
            return (
              <motion.div key={n.id}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:i*.04 }}
                className="glass rounded-2xl p-4 flex gap-3 border transition-all"
                style={{ borderColor: n.li ? 'rgba(255,255,255,.08)' : `${cfg.color}33`, opacity: n.li ? .7 : 1, background: n.li ? 'transparent' : cfg.bg }}>
                <div style={{ width:40, height:40, borderRadius:12, flexShrink:0, background:`${cfg.color}22`, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${cfg.color}33` }}>
                  <Icon size={20} style={{ color:cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white font-bold text-sm">{n.titre}</p>
                    {!n.li && <div style={{ width:8, height:8, borderRadius:'50%', background:cfg.color, flexShrink:0, marginTop:4 }} />}
                  </div>
                  <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{n.mesaj}</p>
                  <p className="text-white/25 text-xs mt-1">{fmtDate(n.date)}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Admin reset codes (only for admin) */}
    </div>
  )
}
