'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize)
  const signOut = useAuthStore((state) => state.signOut)

  useEffect(() => {
    initialize()

    // Keep localStorage token fresh whenever Supabase refreshes the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        signOut()
        return
      }
      if (session) {
        localStorage.setItem('token', session.access_token)
        localStorage.setItem('refreshToken', session.refresh_token ?? '')
      }
    })

    return () => subscription.unsubscribe()
  }, [initialize, signOut])

  return <>{children}</>
}
