import { api } from '@/lib/api'

export interface Deal {
  id: string
  partner_id: string
  created_by: string
  zoho_deal_id?: string
  deal_name: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  amount: number
  stage: string
  close_date?: string // Deprecated: kept for backward compatibility
  approval_date?: string // New field: maps to Zoho Approval Time Stamp
  probability: number
  lead_source?: string
  notes?: string
  metadata?: any
  zoho_sync_status: string
  last_sync_at?: string
  created_at: string
  updated_at: string
  creator?: {
    first_name: string
    last_name: string
    role: string
  }
}

export interface DealStageHistory {
  id: string
  deal_id: string
  old_stage?: string
  new_stage: string
  changed_by_user_id?: string
  notes?: string
  created_at: string
}

export interface SyncDealsResponse {
  success: boolean
  message: string
  data: {
    total: number
    created: number
    updated: number
    skipped: number
    details: Array<{
      zoho_deal_id: string
      deal_name: string
      status: string
      deal_id?: string
      reason?: string
    }>
  }
}

export const dealsService = {
  /**
   * Get all deals for the authenticated partner
   */
  async getAll(): Promise<{ local_deals: Deal[]; zoho_deals: any[]; is_sub_account?: boolean }> {
    const response = await api.get<{ local_deals: Deal[]; zoho_deals: any[]; is_sub_account?: boolean }>('/api/deals')
    return response.data || { local_deals: [], zoho_deals: [] }
  },

  /**
   * Get a specific deal by ID
   */
  async getById(id: string): Promise<Deal> {
    const response = await api.get<Deal>(`/api/deals/${id}`)
    return response.data!
  },

  /**
   * Update deal stage
   */
  async updateStage(id: string, stage: string, notes?: string): Promise<Deal> {
    const response = await api.patch<Deal>(`/api/deals/${id}/stage`, {
      stage,
      notes
    })
    return response.data!
  },

  /**
   * Sync deals from Zoho CRM
   */
  async syncFromZoho(): Promise<SyncDealsResponse['data']> {
    const response = await api.post<SyncDealsResponse['data']>('/api/deals/sync')
    return response.data!
  }
}

