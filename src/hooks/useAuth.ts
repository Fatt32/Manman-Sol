'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCookie } from '@/lib/utils'
import type { PublicUser } from '@/lib/types'

export function useAuth(redirect = true) {
  const [user, setUser]   = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = getCookie('sol_token')
    if (!token) {
      if (redirect) router.replace('/koneksyon')
      setLoading(false)
      return
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) {
          if (redirect) router.replace('/koneksyon')
        } else {
          setUser(data.user)
        }
      })
      .finally(() => setLoading(false))
  }, [redirect, router])

  return { user, loading }
}
