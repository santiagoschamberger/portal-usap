import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { supabase } from './supabase'
import { activityTracker } from './activity-tracker'

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

async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, partner_id, role, first_name, last_name, created_at, updated_at')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  // DB uses snake_case; cast via unknown since User type uses camelCase but runtime code accesses snake_case fields
  return data as unknown as User
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

          // Store Supabase token so api.ts interceptor sends it to the backend
          localStorage.setItem('token', data.session.access_token)
          localStorage.setItem('refreshToken', data.session.refresh_token ?? '')

          const userProfile = await fetchUserProfile(data.user.id)
          if (!userProfile) {
            await supabase.auth.signOut()
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
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

          // Keep localStorage in sync so api.ts interceptor always has a fresh token
          localStorage.setItem('token', session.access_token)
          localStorage.setItem('refreshToken', session.refresh_token ?? '')

          const userProfile = await fetchUserProfile(session.user.id)
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

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/partners/me/type`, {
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
        set({ user: impersonatedUser, originalUser, isImpersonating: true })
        void get().fetchPartnerType()
      },

      stopImpersonation: () => {
        const { originalUser } = get()
        if (originalUser) {
          set({ user: originalUser, originalUser: null, isImpersonating: false })
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
