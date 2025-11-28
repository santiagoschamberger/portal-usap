import { api } from '@/lib/api'

// Lead interfaces - matches database schema
export interface Lead {
  id: string
  partner_id: string
  created_by: string
  zoho_lead_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  status: string
  lead_source: string
  notes?: string
  zoho_sync_status?: 'pending' | 'synced' | 'error'
  last_sync_at?: string
  created_at: string
  updated_at: string
  zoho_status?: string
  creator?: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
}

export interface CreateLeadData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  state?: string
  lander_message?: string
  full_name?: string
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

export interface PaginatedLeadsResponse {
  data: Lead[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface LeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  date_range?: string;
}

// Lead Service
export const leadService = {
  /**
   * Get leads for the authenticated partner with pagination and filters
   * Fetches from local database (which is synced with Zoho)
   */
  async getLeads(filters: LeadFilters = {}): Promise<PaginatedLeadsResponse> {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.date_range) params.append('date_range', filters.date_range);

      // FIX: Cast to any to safely access the full response body structure
      const response = await api.get<any>(`/api/leads?${params.toString()}`) as any;
      
      // FIX: Ensure we return the object with both data and pagination
      return {
        data: response.data || [],
        pagination: response.pagination || { total: 0, page: 1, limit: 10, pages: 0 }
      }
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
      const { data } = await this.getLeads({ limit: 1000 })
      
      // Updated to match new Phase 3 status values
      const stats: LeadStats = {
        total: data.length,
        new: data.filter(l => l.status === 'Pre-Vet / New Lead').length,
        contacted: data.filter(l => l.status === 'Contacted').length,
        qualified: data.filter(l => l.status === 'Sent for Signature / Submitted').length,
        converted: data.filter(l => l.status === 'Approved').length,
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
      const { data } = await this.getLeads({ limit: 10, page: 1 })
      return data
    } catch (err) {
      console.error('Error fetching recent leads:', err)
      throw err
    }
  },

  /**
   * Sync historical leads from Zoho CRM
   */
  async syncLeadsFromZoho(): Promise<{
    total: number
    created: number
    updated: number
    skipped: number
    details: Array<{
      zoho_lead_id: string
      email?: string
      status: 'created' | 'updated' | 'skipped' | 'error'
      reason?: string
      lead_id?: string
    }>
  }> {
    try {
      const response = await api.post<{
        total: number
        created: number
        updated: number
        skipped: number
        details: Array<{
          zoho_lead_id: string
          email?: string
          status: 'created' | 'updated' | 'skipped' | 'error'
          reason?: string
          lead_id?: string
        }>
      }>('/api/leads/sync')
      return response.data!
    } catch (error) {
      console.error('Error syncing leads from Zoho:', error)
      throw error
    }
  },
}
