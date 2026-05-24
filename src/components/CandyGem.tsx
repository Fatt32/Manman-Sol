'use client'

const CLIP: Record<string, string> = {
  diamond:  'polygon(50% 0%, 100% 38%, 75% 100%, 25% 100%, 0% 38%)',
  hexagon:  'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  rhombus:  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  octagon:  'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
  triangle: 'polygon(50% 0%, 97% 100%, 3% 100%)',
  shield:   'polygon(0% 0%, 100% 0%, 100% 65%, 50% 100%, 0% 65%)',
}

function hexParts(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

interface Props {
  color:       string
  shape:       keyof typeof CLIP
  size:        number
  top?:        string
  left?:       string
  right?:      string
  bottom?:     string
  animDur:     number
  animDel:     number
  animVariant: 'a' | 'b' | 'c'
}

export default function CandyGem({ color, shape, size, top, left, right, bottom, animDur, animDel, animVariant }: Props) {
  const [r, g, b] = hexParts(color)
  const lite  = `rgba(${Math.min(r+80,255)},${Math.min(g+80,255)},${Math.min(b+80,255)},1)`
  const dark  = `rgba(${Math.max(r-60,0)},${Math.max(g-60,0)},${Math.max(b-60,0)},0.95)`
  const glow1 = `${color}cc`
  const glow2 = `${color}44`

  return (
    <div style={{
      position: 'absolute', top, left, right, bottom,
      width: size, height: size,
      filter: `drop-shadow(0 0 ${Math.round(size*.4)}px ${glow1}) drop-shadow(0 0 ${Math.round(size*.9)}px ${glow2})`,
      pointerEvents: 'none',
    }}>
      <div style={{
        width: '100%', height: '100%',
        animation: `gem-float-${animVariant} ${animDur}s ease-in-out infinite ${animDel}s`,
        willChange: 'transform',
      }}>
        <div style={{
          width: '100%', height: '100%',
          clipPath: CLIP[shape],
          background: `linear-gradient(145deg, ${lite} 0%, ${color} 45%, ${dark} 100%)`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.18) 30%, transparent 55%)' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(315deg, rgba(0,0,0,0.28) 0%, transparent 50%)' }} />
        </div>
      </div>
    </div>
  )
}
