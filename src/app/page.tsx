import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readJSON } from '@/lib/db'
import type { User } from '@/lib/types'
import AnimatedBg from '@/components/AnimatedBg'

export default async function LandingPage() {
  /* If no users exist yet, redirect to setup */
  const users = await readJSON<User[]>('users.json', [])
  if (users.length === 0) redirect('/setup')
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 py-16">
      <AnimatedBg />

      <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-sm w-full">
        {/* Logo */}
        <div style={{
          width: 96, height: 96, borderRadius: 28,
          background: 'linear-gradient(135deg, #FF3DA0 0%, #A855F7 50%, #38BDF8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(168,85,247,.6), 0 0 0 1px rgba(255,255,255,.15)',
          animation: 'float-gentle 3.5s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 48 }}>💰</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-5xl font-black gradient-text" style={{ lineHeight: 1.1 }}>
            Manman Sol
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Jere sol ou ak fasilite.<br />
            Sekirize, transparan, pwofesyonèl.
          </p>
        </div>

        {/* Feature pills — 2×2 grid, always fits */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%' }}>
          {[
            { icon:'🎯', label:'Tiraj Otomatik' },
            { icon:'💳', label:'Swiv Peman'     },
            { icon:'📊', label:'Estatistik'      },
            { icon:'🔒', label:'100% Sekirize'  },
          ].map(({ icon, label }) => (
            <div key={label} className="glass rounded-2xl flex items-center gap-2 text-white/70"
              style={{ padding:'10px 14px', fontSize:13 }}>
              <span style={{ fontSize:18, lineHeight:1 }}>{icon}</span>
              <span style={{ fontWeight:600 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 w-full">
          <Link href="/koneksyon"
            className="candy-btn block w-full py-4 text-center text-white font-bold text-lg rounded-full"
            style={{ textDecoration: 'none' }}>
            Konekte
          </Link>
          <Link href="/enrejistre"
            className="block w-full py-3.5 text-center font-semibold text-base rounded-full glass border border-white/15 text-white/80 hover:text-white hover:border-white/25 transition-all"
            style={{ textDecoration: 'none' }}>
            Kreye Kont
          </Link>
        </div>

        <p className="text-white/30 text-xs">
          Ayiti 🇭🇹 — Fe Sol Ou Tounen Fòs Ou
        </p>
      </div>
    </main>
  )
}
