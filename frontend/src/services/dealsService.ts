import { apiClient } from '@/lib/api-client'

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
  close_date?: string
  probability: number
  lead_source?: string
  notes?: string
  metadata?: any
  zoho_sync_status: string
  last_sync_at?: string
  created_at: string
  updated_at: string
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

class DealsService {
  /**
   * Get all deals for the authenticated partner
   */
  async getAll(): Promise<{ local_deals: Deal[]; zoho_deals: any[] }> {
    const response = await apiClient.get('/deals')
    return response.data.data
  }

  /**
   * Get a specific deal by ID
   */
  async getById(id: string): Promise<Deal> {
    const response = await apiClient.get(`/deals/${id}`)
    return response.data.data
  }

  /**
   * Update deal stage
   */
  async updateStage(id: string, stage: string, notes?: string): Promise<Deal> {
    const response = await apiClient.patch(`/deals/${id}/stage`, {
      stage,
      notes
    })
    return response.data.data
  }

  /**
   * Sync deals from Zoho CRM
   */
  async syncFromZoho(): Promise<SyncDealsResponse['data']> {
    const response = await apiClient.post('/deals/sync')
    return response.data.data
  }
}

export const dealsService = new DealsService()

