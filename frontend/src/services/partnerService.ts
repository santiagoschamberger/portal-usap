import { api } from '@/lib/api'

// Sub-account interfaces
export interface SubAccount {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  lead_stats?: {
    total_leads: number
    new_leads: number
    contacted: number
    qualified: number
    proposal: number
    closed_won: number
    closed_lost: number
  }
}

export interface CreateSubAccountData {
  email: string
  first_name: string
  last_name: string
}

export interface UpdateSubAccountData {
  first_name?: string
  last_name?: string
  is_active?: boolean
}

export interface Partner {
  id: string
  zoho_partner_id?: string
  name: string
  email: string
  phone?: string
  address?: string
  approved: boolean
  status: string
  created_at: string
  updated_at: string
}

// Partner Service
export const partnerService = {
  /**
   * Get current partner's profile
   */
  async getProfile(): Promise<Partner> {
    try {
      const response = await api.get<Partner>('/api/partners/profile')
      return response.data!
    } catch (error) {
      console.error('Error fetching partner profile:', error)
      throw error
    }
  },

  /**
   * Update partner profile
   */
  async updateProfile(data: Partial<Partner>): Promise<Partner> {
    try {
      const response = await api.put<Partner>('/api/partners/profile', data)
      return response.data!
    } catch (error) {
      console.error('Error updating partner profile:', error)
      throw error
    }
  },

  /**
   * Get all sub-accounts
   */
  async getSubAccounts(): Promise<SubAccount[]> {
    try {
      const response = await api.get<SubAccount[]>('/api/partners/sub-accounts')
      return response.data || []
    } catch (error) {
      console.error('Error fetching sub-accounts:', error)
      throw error
    }
  },

  /**
   * Get specific sub-account details
   */
  async getSubAccount(id: string): Promise<SubAccount> {
    try {
      const response = await api.get<SubAccount>(`/api/partners/sub-accounts/${id}`)
      return response.data!
    } catch (error) {
      console.error('Error fetching sub-account:', error)
      throw error
    }
  },

  /**
   * Create a new sub-account
   */
  async createSubAccount(data: CreateSubAccountData): Promise<SubAccount> {
    try {
      const response = await api.post<SubAccount>('/api/partners/sub-accounts', data)
      return response.data!
    } catch (error) {
      console.error('Error creating sub-account:', error)
      throw error
    }
  },

  /**
   * Update sub-account
   */
  async updateSubAccount(id: string, data: UpdateSubAccountData): Promise<SubAccount> {
    try {
      const response = await api.put<SubAccount>(`/api/partners/sub-accounts/${id}`, data)
      return response.data!
    } catch (error) {
      console.error('Error updating sub-account:', error)
      throw error
    }
  },

  /**
   * Send activation email to sub-account
   */
  async activateSubAccount(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/partners/sub-accounts/${id}/activate`,
        {}
      )
      return response.data!
    } catch (error) {
      console.error('Error activating sub-account:', error)
      throw error
    }
  },

  /**
   * Deactivate sub-account
   */
  async deactivateSubAccount(id: string): Promise<void> {
    try {
      await api.delete(`/api/partners/sub-accounts/${id}`)
    } catch (error) {
      console.error('Error deactivating sub-account:', error)
      throw error
    }
  },

  /**
   * Impersonate a sub-account (admin only)
   */
  async impersonateSubAccount(subAccountId: string): Promise<{
    success: boolean
    message: string
    data: {
      user: any
      token: string
    }
  }> {
    try {
      const response = await api.post<{
        success: boolean
        message: string
        data: {
          user: any
          token: string
        }
      }>(`/api/partners/impersonate/${subAccountId}`, {})
      // Return the raw API payload (it already contains success/message/data)
      return response as unknown as {
        success: boolean
        message: string
        data: { user: any; token: string }
      }
    } catch (error) {
      console.error('Error impersonating sub-account:', error)
      throw error
    }
  },

  /**
   * Search all users in the system (admin only)
   */
  async searchUsers(query?: string, limit?: number, offset?: number): Promise<{
    success: boolean
    data: Array<{
      id: string
      email: string
      first_name: string | null
      last_name: string | null
      role: string
      partner_id: string
      is_active: boolean
      partners: {
        id: string
        name: string
        partner_type: string
      } | null
    }>
    meta?: {
      total: number | null
      limit: number
      offset: number
    }
  }> {
    try {
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (limit) params.append('limit', limit.toString())
      if (typeof offset === 'number') params.append('offset', offset.toString())
      
      const response = await api.get<any>(`/api/partners/users/search?${params.toString()}`)
      // Return the raw API payload (it already contains success/data/meta)
      return response as unknown as {
        success: boolean
        data: any[]
        meta?: {
          total: number | null
          limit: number
          offset: number
        }
      }
    } catch (error) {
      console.error('Error searching users:', error)
      throw error
    }
  },

  /**
   * Impersonate any user in the system (admin only)
   */
  async impersonateUser(userId: string): Promise<{
    success: boolean
    message: string
    data: {
      user: any
      token: string
      partner: any
    }
  }> {
    try {
      const response = await api.post<{
        success: boolean
        message: string
        data: {
          user: any
          token: string
          partner: any
        }
      }>(`/api/partners/impersonate-any/${userId}`, {})
      // Return the raw API payload (it already contains success/message/data)
      return response as unknown as {
        success: boolean
        message: string
        data: { user: any; token: string; partner: any }
      }
    } catch (error) {
      console.error('Error impersonating user:', error)
      throw error
    }
  },

  /**
   * Sync contacts from Zoho CRM
   */
  async syncContactsFromZoho(): Promise<{
    success: boolean
    message: string
    synced: number
    created: number
    updated: number
  }> {
    try {
      const response = await api.post<{
        success: boolean
        message: string
        synced: number
        created: number
        updated: number
      }>('/api/partners/sync-contacts', {})
      return response.data!
    } catch (error) {
      console.error('Error syncing contacts from Zoho:', error)
      throw error
    }
  },
}

