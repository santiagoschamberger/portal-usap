import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { AuthService } from '@/services/authService'
import { activityTracker } from './activity-tracker'

interface AuthStore {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isImpersonating: boolean
  originalUser: User | null
  partnerType: 'partner' | 'agent' | 'iso' | null
  isAgent: boolean
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
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
          const data = await AuthService.login({ email, password })
          set({ user: data.user, isAuthenticated: true })
          
          // Fetch partner type after login
          await get().fetchPartnerType()
          
          // Track login activity
          activityTracker.addActivity('login', `Signed in to your account`)
          
          return { error: null }
        } catch (error) {
          return { error }
        }
      },

      signOut: async () => {
        await AuthService.logout()
        set({ 
          user: null, 
          isAuthenticated: false,
          isImpersonating: false,
          originalUser: null,
          partnerType: null,
          isAgent: false
        })
      },

      initialize: async () => {
        try {
          const user = AuthService.getCurrentUser()
          const isAuthenticated = AuthService.isAuthenticated()
          set({ 
            user, 
            isAuthenticated,
            loading: false 
          })
          
          // Fetch partner type if authenticated
          if (isAuthenticated) {
            await get().fetchPartnerType()
          }
        } catch {
          set({ loading: false, isAuthenticated: false })
        }
      },

      fetchPartnerType: async () => {
        try {
          const token = AuthService.getToken()
          if (!token) {
            console.warn('No token available for fetching partner type')
            return
          }
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/partners/me/type`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            set({ 
              partnerType: data.data.partner_type,
              isAgent: data.data.is_agent
            })
          }
        } catch (error) {
          console.error('Failed to fetch partner type:', error)
          // Set defaults on error
          set({ partnerType: 'partner', isAgent: false })
        }
      },

      startImpersonation: (impersonatedUser: User, originalUser: User) => {
        set({
          user: impersonatedUser,
          originalUser: originalUser,
          isImpersonating: true
        })
      },

      stopImpersonation: () => {
        const { originalUser } = get()
        if (originalUser) {
          set({
            user: originalUser,
            originalUser: null,
            isImpersonating: false
          })
        }
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isImpersonating: state.isImpersonating,
        originalUser: state.originalUser,
        partnerType: state.partnerType,
        isAgent: state.isAgent
      })
    }
  )
)