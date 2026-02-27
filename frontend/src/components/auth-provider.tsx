'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()

    // Keep localStorage token fresh when Supabase silently refreshes the session.
    // Do NOT call signOut() here — that would create an infinite loop with the store.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        return
      }
      if (session) {
        localStorage.setItem('token', session.access_token)
        localStorage.setItem('refreshToken', session.refresh_token ?? '')
      }
    })

    return () => subscription.unsubscribe()
  }, [initialize])

  return <>{children}</>
}
