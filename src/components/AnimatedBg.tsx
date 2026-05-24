'use client'

const GEMS = [
  { color:'#FF3DA0', shape:'diamond',  size:52, top:'8%',  left:'5%',  dur:6, del:0,   v:'a' },
  { color:'#A855F7', shape:'hexagon',  size:38, top:'15%', right:'8%', dur:7, del:1.2, v:'b' },
  { color:'#38BDF8', shape:'rhombus',  size:44, top:'40%', left:'3%',  dur:5, del:0.5, v:'c' },
  { color:'#34D399', shape:'octagon',  size:36, top:'60%', right:'5%', dur:8, del:2,   v:'a' },
  { color:'#FCD34D', shape:'triangle', size:40, top:'75%', left:'8%',  dur:6, del:1,   v:'b' },
  { color:'#FB923C', shape:'shield',   size:34, top:'30%', right:'12%',dur:7, del:0.8, v:'c' },
  { color:'#FF3DA0', shape:'hexagon',  size:28, top:'85%', right:'15%',dur:5, del:1.5, v:'a' },
  { color:'#A855F7', shape:'diamond',  size:32, top:'55%', left:'90%', dur:6, del:0.3, v:'b' },
] as const

function hexParts(hex: string): [number,number,number] {
  const n = parseInt(hex.replace('#',''), 16)
  return [(n>>16)&0xff,(n>>8)&0xff,n&0xff]
}

export default function AnimatedBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex:0 }}>
      {/* Deep orbs */}
      <div style={{
        position:'absolute', width:600, height:600,
        top:'-10%', left:'-5%',
        background:'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
        animation:'orb-drift 18s ease-in-out infinite',
      }} />
      <div style={{
        position:'absolute', width:500, height:500,
        bottom:'-5%', right:'-8%',
        background:'radial-gradient(circle, rgba(255,61,160,0.10) 0%, transparent 70%)',
        animation:'orb-drift 22s ease-in-out infinite reverse',
      }} />
      <div style={{
        position:'absolute', width:400, height:400,
        top:'40%', left:'40%',
        background:'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
        animation:'orb-drift 15s ease-in-out infinite 3s',
      }} />

      {/* Floating gems */}
      {GEMS.map((g, i) => {
        const [r,gr,b] = hexParts(g.color)
        const lite  = `rgba(${Math.min(r+80,255)},${Math.min(gr+80,255)},${Math.min(b+80,255)},1)`
        const dark  = `rgba(${Math.max(r-60,0)},${Math.max(gr-60,0)},${Math.max(b-60,0)},0.95)`
        const glow1 = `${g.color}cc`
        const glow2 = `${g.color}44`
        const clips: Record<string,string> = {
          diamond:'polygon(50% 0%, 100% 38%, 75% 100%, 25% 100%, 0% 38%)',
          hexagon:'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
          rhombus:'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          octagon:'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          triangle:'polygon(50% 0%, 97% 100%, 3% 100%)',
          shield:'polygon(0% 0%, 100% 0%, 100% 65%, 50% 100%, 0% 65%)',
        }
        return (
          <div key={i} style={{
            position:'absolute',
            top: 'top' in g ? g.top : undefined,
            left: 'left' in g ? (g as {left?:string}).left : undefined,
            right: 'right' in g ? (g as {right?:string}).right : undefined,
            width: g.size, height: g.size,
            filter:`drop-shadow(0 0 ${Math.round(g.size*.4)}px ${glow1}) drop-shadow(0 0 ${Math.round(g.size*.9)}px ${glow2})`,
          }}>
            <div style={{
              width:'100%', height:'100%',
              animation:`gem-float-${g.v} ${g.dur}s ease-in-out infinite ${g.del}s`,
              willChange:'transform',
            }}>
              <div style={{
                width:'100%', height:'100%',
                clipPath: clips[g.shape],
                background:`linear-gradient(145deg, ${lite} 0%, ${g.color} 45%, ${dark} 100%)`,
                position:'relative', overflow:'hidden',
              }}>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.18) 30%,transparent 55%)'}}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(315deg,rgba(0,0,0,.28) 0%,transparent 50%)'}}/>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
