import { api } from '@/lib/api'

// Lead interfaces - matches database schema
export interface Lead {
  id: string
  partner_id: string
  created_by: string // Maps to created_by in database (user UUID)
  zoho_lead_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'nurture' | 'unqualified'
  lead_source: string // Maps to lead_source in database
  notes?: string
  zoho_sync_status?: 'pending' | 'synced' | 'error'
  last_sync_at?: string
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
      return response.data || { zoho_leads: [], local_leads: [], total: 0 }
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
      return response.data!
    } catch (error) {
      console.error('Error fetching lead:', error)
      throw error
    }
  },

  /**
   * Create a new lead and sync to Zoho CRM
   */
  async createLead(leadData: CreateLeadData): Promise<{
    lead_id: string
    zoho_lead_id: string | null
    local_lead: Lead
    sync_status: 'synced' | 'error'
  }> {
    try {
      const response = await api.post<{
        lead_id: string
        zoho_lead_id: string | null
        local_lead: Lead
        sync_status: 'synced' | 'error'
      }>('/api/leads', leadData)
      return response.data!
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
      return response.data!
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
    } catch (err) {
      console.error('Error calculating lead stats:', err)
      throw err
    }
  },

  /**
   * Get recent leads (last 10)
   */
  async getRecentLeads(): Promise<Lead[]> {
    try {
      const { local_leads } = await this.getLeads()
      return local_leads.slice(0, 10)
    } catch (err) {
      console.error('Error fetching recent leads:', err)
      throw err
    }
  },
}

