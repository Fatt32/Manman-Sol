'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCookie, AUTH_COOKIE } from '@/lib/utils'
import type { PublicUser } from '@/lib/types'

export function useAuth(redirect = true) {
  const [user, setUser]   = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = getCookie(AUTH_COOKIE)
    if (!token) {
      if (redirect) router.replace('/koneksyon')
      setLoading(false)
      return
    }
    fetch('/api/auth/me')
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
