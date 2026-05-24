import Navbar from '@/components/Navbar'
import AnimatedBg from '@/components/AnimatedBg'

export default function SolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <AnimatedBg />
      <Navbar />
      <main className="relative z-10 pt-16 pb-24 lg:pb-8 px-4 lg:px-8">
        {children}
      </main>
    </div>
  )
}
