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
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
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

      signIn: async (email: string, password: string) => {
        try {
          const data = await AuthService.login({ email, password })
          set({ user: data.user, isAuthenticated: true })
          
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
          originalUser: null
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
        } catch {
          set({ loading: false, isAuthenticated: false })
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
        originalUser: state.originalUser
      })
    }
  )
)