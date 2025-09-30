import { api } from '@/lib/api'

// Lead interfaces
export interface Lead {
  id: string
  partner_id: string
  created_by_user_id: string
  zoho_lead_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  status: string
  source: string
  notes?: string
  zoho_sync_status?: 'synced' | 'pending' | 'failed'
  created_at: string
  updated_at: string
}

export interface ZohoLead {
  id: string
  Full_Name: string
  Email: string
  Company: string
  Phone: string
  Lead_Status: string
  StrategicPartnerId: string
  Lead_Source: string
  Created_Time: string
}

export interface CreateLeadData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  business_type?: string | string[]
  description?: string
}

export interface LeadStats {
  total: number
  new: number
  contacted: number
  qualified: number
  converted: number
}

export interface LeadsResponse {
  zoho_leads: ZohoLead[]
  local_leads: Lead[]
  total: number
}

// Lead Service
export const leadService = {
  /**
   * Get all leads for the authenticated partner
   * Fetches from both Zoho CRM and local database
   */
  async getLeads(): Promise<LeadsResponse> {
    try {
      const response = await api.get<LeadsResponse>('/api/leads')
      return response.data
    } catch (error) {
      console.error('Error fetching leads:', error)
      throw error
    }
  },

  /**
   * Get specific lead details by ID
   */
  async getLeadById(id: string): Promise<Lead> {
    try {
      const response = await api.get<Lead>(`/api/leads/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching lead:', error)
      throw error
    }
  },

  /**
   * Create a new lead and sync to Zoho CRM
   */
  async createLead(leadData: CreateLeadData): Promise<{
    zoho_lead_id: string
    local_lead: Lead
    zoho_response: any
  }> {
    try {
      const response = await api.post<{
        zoho_lead_id: string
        local_lead: Lead
        zoho_response: any
      }>('/api/leads', leadData)
      return response.data
    } catch (error) {
      console.error('Error creating lead:', error)
      throw error
    }
  },

  /**
   * Update lead status
   */
  async updateLeadStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<Lead> {
    try {
      const response = await api.patch<Lead>(`/api/leads/${id}/status`, {
        status,
        notes,
      })
      return response.data
    } catch (error) {
      console.error('Error updating lead status:', error)
      throw error
    }
  },

  /**
   * Get lead statistics
   * Calculates stats from fetched leads
   */
  async getLeadStats(): Promise<LeadStats> {
    try {
      const { zoho_leads, local_leads } = await this.getLeads()
      
      // Combine leads for stats calculation
      const allLeads = [...local_leads, ...zoho_leads.map(zl => ({
        ...zl,
        status: zl.Lead_Status?.toLowerCase() || 'unknown'
      }))]

      const stats: LeadStats = {
        total: allLeads.length,
        new: allLeads.filter(l => l.status === 'new').length,
        contacted: allLeads.filter(l => l.status === 'contacted').length,
        qualified: allLeads.filter(l => l.status === 'qualified').length,
        converted: allLeads.filter(l => l.status === 'converted').length,
      }

      return stats
    } catch (error) {
      console.error('Error calculating lead stats:', error)
      throw error
    }
  },

  /**
   * Get recent leads (last 10)
   */
  async getRecentLeads(): Promise<Lead[]> {
    try {
      const { local_leads } = await this.getLeads()
      return local_leads.slice(0, 10)
    } catch (error) {
      console.error('Error fetching recent leads:', error)
      throw error
    }
  },
}

