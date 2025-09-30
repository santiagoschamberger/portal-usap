import { leadService } from './leadService'

/**
 * Zoho Service
 * Main integration point for Zoho CRM functionality
 * Provides a clean interface for frontend components
 */
export const zohoService = {
  // Lead Management
  leads: {
    getAll: leadService.getLeads,
    getById: leadService.getLeadById,
    create: leadService.createLead,
    updateStatus: leadService.updateLeadStatus,
    getStats: leadService.getLeadStats,
    getRecent: leadService.getRecentLeads,
  },
}

export default zohoService

