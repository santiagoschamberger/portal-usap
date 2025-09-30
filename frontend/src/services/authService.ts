import { api } from '@/lib/api'
import { User, LoginFormData, ForgotPasswordFormData, ResetPasswordFormData } from '@/types'

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
}

export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginFormData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials)
    
    if (response.success && response.data) {
      // Store tokens in localStorage
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      return response.data
    }
    
    throw new Error(response.error || 'Login failed')
  }

  /**
   * Logout user and clear tokens
   */
  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      // Always clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await api.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken
    })

    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token)
      return response.data.token
    }

    throw new Error(response.error || 'Token refresh failed')
  }

  /**
   * Get current user from localStorage
   */
  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
      return null
    }
  }

  /**
   * Get current auth token
   */
  static getToken(): string | null {
    return localStorage.getItem('token')
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    return !!(token && user)
  }

  /**
   * Initiate forgot password process
   */
  static async forgotPassword(data: ForgotPasswordFormData): Promise<void> {
    const response = await api.post('/auth/forgot-password', data)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to send reset email')
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(data: ResetPasswordFormData): Promise<void> {
    const response = await api.post('/auth/reset-password', {
      token: data.token,
      password: data.password
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to reset password')
    }
  }

  /**
   * Verify reset token validity
   */
  static async verifyResetToken(token: string): Promise<boolean> {
    try {
      const response = await api.post('/auth/verify-reset-token', { token })
      return response.success
    } catch (error) {
      return false
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/profile')
    
    if (response.success && response.data) {
      // Update local storage with fresh user data
      localStorage.setItem('user', JSON.stringify(response.data))
      return response.data
    }
    
    throw new Error(response.error || 'Failed to fetch profile')
  }

  /**
   * Update user profile
   */
  static async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await api.put<User>('/auth/profile', userData)
    
    if (response.success && response.data) {
      // Update local storage with updated user data
      localStorage.setItem('user', JSON.stringify(response.data))
      return response.data
    }
    
    throw new Error(response.error || 'Failed to update profile')
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to change password')
    }
  }
}

export default AuthService 