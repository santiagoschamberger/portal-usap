import { supabase } from '@/lib/supabase'
import { User } from '@/types'

export class AuthService {
  static async forgotPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  }

  static async resetPassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  }

  static getToken(): string | null {
    return localStorage.getItem('token')
  }

  static isAuthenticated(): boolean {
    return !!(localStorage.getItem('token') && localStorage.getItem('user'))
  }
}

export default AuthService
