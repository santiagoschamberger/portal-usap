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

