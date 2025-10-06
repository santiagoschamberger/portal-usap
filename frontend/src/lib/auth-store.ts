import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { AuthService } from '@/services/authService'

interface AuthStore {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      isAuthenticated: false,

      signIn: async (email: string, password: string) => {
        try {
          const data = await AuthService.login({ email, password })
          set({ user: data.user, isAuthenticated: true })
          return { error: null }
        } catch (error) {
          return { error }
        }
      },

      signOut: async () => {
        await AuthService.logout()
        set({ user: null, isAuthenticated: false })
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
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user
      })
    }
  )
)