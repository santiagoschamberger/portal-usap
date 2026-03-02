import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { supabase } from './supabase'
import { activityTracker } from './activity-tracker'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

/**
 * Fetch the portal user profile from the backend.
 * The backend uses the Supabase admin client which bypasses RLS entirely,
 * avoiding the recursive RLS policy issue on public.users.
 */
async function fetchUserProfile(accessToken: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json.data ?? json) as User
  } catch {
    return null
  }
}

interface AuthStore {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isImpersonating: boolean
  originalUser: User | null
  partnerType: 'partner' | 'agent' | 'iso' | null
  isAgent: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  fetchPartnerType: () => Promise<void>
  startImpersonation: (impersonatedUser: User, originalUser: User) => void
  stopImpersonation: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      isAuthenticated: false,
      isImpersonating: false,
      originalUser: null,
      partnerType: null,
      isAgent: false,

      signIn: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })

          if (error || !data.session) {
            return { error: error ?? new Error('Login failed') }
          }

          const { access_token, refresh_token } = data.session
          localStorage.setItem('token', access_token)
          localStorage.setItem('refreshToken', refresh_token ?? '')

          const userProfile = await fetchUserProfile(access_token)
          if (!userProfile) {
            // Sign out cleanly — auth-provider will clear localStorage via SIGNED_OUT event
            await supabase.auth.signOut()
            return { error: new Error('Your account is not set up in the portal yet. Please contact support.') }
          }

          localStorage.setItem('user', JSON.stringify(userProfile))
          set({ user: userProfile, isAuthenticated: true })

          await get().fetchPartnerType()
          activityTracker.addActivity('login', 'Signed in to your account')

          return { error: null }
        } catch (err) {
          return { error: err instanceof Error ? err : new Error('Login failed') }
        }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        set({
          user: null,
          isAuthenticated: false,
          isImpersonating: false,
          originalUser: null,
          partnerType: null,
          isAgent: false,
        })
      },

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()

          if (!session) {
            set({ user: null, isAuthenticated: false, loading: false })
            return
          }

          // Always keep the token fresh
          localStorage.setItem('token', session.access_token)
          localStorage.setItem('refreshToken', session.refresh_token ?? '')

          // If impersonation is active, do NOT overwrite the impersonated user.
          // Just mark as authenticated and update the token.
          const { isImpersonating } = get()
          if (isImpersonating) {
            set({ isAuthenticated: true, loading: false })
            return
          }

          const userProfile = await fetchUserProfile(session.access_token)
          if (!userProfile) {
            set({ user: null, isAuthenticated: false, loading: false })
            return
          }

          localStorage.setItem('user', JSON.stringify(userProfile))
          set({ user: userProfile, isAuthenticated: true, loading: false })
          await get().fetchPartnerType()
        } catch {
          set({ loading: false, isAuthenticated: false })
        }
      },

      fetchPartnerType: async () => {
        try {
          const token = localStorage.getItem('token')
          if (!token) return

          const { isImpersonating, user } = get()

          const response = await fetch(`${API_URL}/api/partners/me/type`, {
            headers: {
              Authorization: `Bearer ${token}`,
              ...(isImpersonating && user?.id ? { 'X-Impersonate-User-Id': user.id } : {}),
            },
          })

          if (response.ok) {
            const data = await response.json()
            set({ partnerType: data.data.partner_type, isAgent: data.data.is_agent })
          }
        } catch {
          set({ partnerType: 'partner', isAgent: false })
        }
      },

      startImpersonation: (impersonatedUser: User, originalUser: User) => {
        console.log('[AUTH STORE] Starting impersonation:', {
          impersonatedUser: {
            id: impersonatedUser.id,
            email: impersonatedUser.email,
            partner_id: impersonatedUser.partner_id,
            role: impersonatedUser.role
          },
          originalUser: {
            id: originalUser.id,
            email: originalUser.email,
            role: originalUser.role
          }
        })
        
        set({ user: impersonatedUser, originalUser, isImpersonating: true })
        
        // Verify state was set correctly
        const newState = get()
        console.log('[AUTH STORE] Impersonation state after set:', {
          isImpersonating: newState.isImpersonating,
          userId: newState.user?.id,
          userEmail: newState.user?.email,
          userPartnerId: newState.user?.partner_id,
          originalUserId: newState.originalUser?.id
        })
        
        void get().fetchPartnerType()
      },

      stopImpersonation: () => {
        const { originalUser } = get()
        console.log('[AUTH STORE] Stopping impersonation:', {
          originalUser: originalUser ? {
            id: originalUser.id,
            email: originalUser.email,
            role: originalUser.role
          } : null
        })
        
        if (originalUser) {
          set({ user: originalUser, originalUser: null, isImpersonating: false })
          
          // Verify state was reset correctly
          const newState = get()
          console.log('[AUTH STORE] State after stopping impersonation:', {
            isImpersonating: newState.isImpersonating,
            userId: newState.user?.id,
            userEmail: newState.user?.email
          })
          
          void get().fetchPartnerType()
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isImpersonating: state.isImpersonating,
        originalUser: state.originalUser,
        partnerType: state.partnerType,
        isAgent: state.isAgent,
      }),
    }
  )
)
