import { leadService } from './leadService'

/**
 * Zoho Service
 * Main integration point for Zoho CRM functionality
 * Provides a clean interface for frontend components
 */
export const zohoService = {
  // Lead Management
  leads: {
    getAll: () => leadService.getLeads(),
    getById: (id: string) => leadService.getLeadById(id),
    create: (data: any) => leadService.createLead(data),
    updateStatus: (id: string, status: string, notes?: string) => 
      leadService.updateLeadStatus(id, status, notes),
    getStats: () => leadService.getLeadStats(),
    getRecent: () => leadService.getRecentLeads(),
    syncFromZoho: () => leadService.syncLeadsFromZoho(),
  },
}

export default zohoService

