import Navbar from '@/components/Navbar'
import AnimatedBg from '@/components/AnimatedBg'

export default function NotifLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <AnimatedBg />
      <Navbar />
      <main className="relative z-10 pt-16 pb-24 px-4">{children}</main>
    </div>
  )
}
