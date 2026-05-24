'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Users, PlusCircle, Settings, LogOut, Coins, Bell } from 'lucide-react'
import { deleteCookie, getCookie } from '@/lib/utils'

const NAV = [
  { href:'/dashboard', icon:Home,       label:'Akèy'   },
  { href:'/sol',       icon:Coins,      label:'Sol Yo' },
  { href:'/sol/kreye', icon:PlusCircle, label:'Kreye'  },
  { href:'/manm',      icon:Users,      label:'Manm'   },
  { href:'/profil',    icon:Settings,   label:'Pwofil' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [unread, setUnread]   = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const token = getCookie('sol_token')
    if (!token) return
    const check = () =>
      fetch('/api/notifications', { headers:{ Authorization:`Bearer ${token}` } })
        .then(r => r.json()).then(d => setUnread(d.unread ?? 0)).catch(() => {})
    check()
    const iv = setInterval(check, 60_000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function logout() {
    deleteCookie('sol_token')
    router.push('/koneksyon')
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
  }

  return (
    <>
      {/* ── Top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 safe-top transition-all duration-300"
        style={scrolled ? { background:'rgba(10,6,25,0.92)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,.1)', boxShadow:'0 4px 24px rgba(0,0,0,.4)' } : undefined}>
        <div className={`${scrolled ? 'px-4 lg:px-8 py-3 flex items-center justify-between' : 'glass border-b border-white/8 px-4 lg:px-8 py-3 flex items-center justify-between'}`}>
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#FF3DA0,#A855F7)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(168,85,247,.5)' }}>
              <span style={{fontSize:16}}>💰</span>
            </div>
            <span className="font-bold text-lg gradient-text">Manman Sol</span>
          </div>

          {/* Desktop nav links — visible only on lg+ */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map(({ href, icon:Icon, label }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={active
                    ? { background:'rgba(168,85,247,.2)', color:'#C084FC', border:'1px solid rgba(168,85,247,.35)' }
                    : { color:'rgba(255,255,255,.5)', border:'1px solid transparent' }}>
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side: bell + logout */}
          <div className="flex items-center gap-2">
            <Link href="/notifikasyon" className="relative p-2 rounded-xl glass border border-white/8 hover:border-purple-500/30 transition-colors">
              <Bell size={18} className="text-white/60" />
              {unread > 0 && (
                <span style={{
                  position:'absolute', top:-4, right:-4,
                  minWidth:18, height:18, borderRadius:'50%',
                  background:'linear-gradient(135deg,#FF3DA0,#A855F7)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:10, fontWeight:'bold', color:'white',
                  boxShadow:'0 2px 8px rgba(255,61,160,.6)',
                  padding:'0 4px',
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <button onClick={logout} className="text-white/40 hover:text-white/80 transition-colors p-1.5 rounded-lg hover:bg-white/5">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Bottom nav — mobile only ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom">
        <div className="glass border-t border-white/8 px-2 py-2 flex items-center justify-around">
          {NAV.map(({ href, icon:Icon, label }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
                style={active ? { background:'rgba(168,85,247,.15)', boxShadow:'0 0 12px rgba(168,85,247,.2)' } : {}}>
                <Icon size={20} style={active ? { color:'#C084FC', filter:'drop-shadow(0 0 6px rgba(192,132,252,.7))' } : { color:'rgba(255,255,255,.35)' }} />
                <span style={{ fontSize:10, fontWeight:600, color: active ? '#C084FC' : 'rgba(255,255,255,.35)', letterSpacing:'0.03em' }}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
