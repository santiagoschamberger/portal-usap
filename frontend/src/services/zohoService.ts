import { leadService } from './leadService'
import { dealsService } from './dealsService'

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
  
  // Deal Management
  deals: {
    getAll: () => dealsService.getAll(),
    getById: (id: string) => dealsService.getById(id),
    updateStage: (id: string, stage: string, notes?: string) => 
      dealsService.updateStage(id, stage, notes),
    syncFromZoho: () => dealsService.syncFromZoho(),
  },
}

export default zohoService

