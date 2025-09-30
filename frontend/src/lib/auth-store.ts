import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthStore {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      isAuthenticated: false,

      signIn: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            return { error }
          }

          set({ user: data.user, isAuthenticated: true })
          return { error: null }
        } catch (error) {
          return { error }
        }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false })
      },

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          set({ 
            user: session?.user ?? null, 
            isAuthenticated: !!session?.user,
            loading: false 
          })

          supabase.auth.onAuthStateChange(
            async (event, session) => {
              set({ 
                user: session?.user ?? null, 
                isAuthenticated: !!session?.user,
                loading: false 
              })
            }
          )
        } catch (error) {
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