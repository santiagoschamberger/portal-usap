/**
 * Lead Status Mapping Service
 * Maps between Zoho CRM lead statuses and Portal display statuses
 * 
 * Reference: docs/STATUS_STAGE_MAPPING_REFERENCE.md
 */

export class LeadStatusMappingService {
  /**
   * Portal display status → Zoho CRM status
   */
  private static portalToZoho: Record<string, string> = {
    'Pre-Vet / New Lead': 'Lead',
    'Contacted': 'Contacted',
    'Sent for Signature / Submitted': 'Application Submitted',
    'Approved': 'Approved',
    'Declined': 'Declined',
    'Dead / Withdrawn': 'Lost'
  };

  /**
   * Zoho CRM status → Portal display status
   */
  private static zohoToPortal: Record<string, string> = {
    'Lead': 'Pre-Vet / New Lead',
    'Contacted': 'Contacted',
    'Application Submitted': 'Sent for Signature / Submitted',
    'Approved': 'Approved',
    'Declined': 'Declined',
    'Lost': 'Dead / Withdrawn',
    // Additional Zoho statuses that might come through
    'New': 'Pre-Vet / New Lead',
    'Pre-Vet': 'Pre-Vet / New Lead',
    'Qualified': 'Contacted',
    'Unqualified': 'Dead / Withdrawn',
    'Junk Lead': 'Dead / Withdrawn',
    'Not Contacted': 'Pre-Vet / New Lead',
    // Custom statuses from your Zoho
    'Sent Pre-App': 'Contacted',
    'sent pre-app': 'Contacted',
    'Pre-App Sent': 'Contacted',
    'Sent for Signature': 'Sent for Signature / Submitted',
    'Signature Sent': 'Sent for Signature / Submitted'
  };

  /**
   * Map Portal status to Zoho CRM status
   */
  static mapToZoho(portalStatus: string): string {
    return this.portalToZoho[portalStatus] || 'Lead';
  }

  /**
   * Map Zoho CRM status to Portal display status
   */
  static mapFromZoho(zohoStatus: string): string {
    if (!zohoStatus) return 'Pre-Vet / New Lead';
    return this.zohoToPortal[zohoStatus] || 'Pre-Vet / New Lead';
  }

  /**
   * Get all valid Portal statuses
   */
  static getAllPortalStatuses(): string[] {
    return Object.keys(this.portalToZoho);
  }

  /**
   * Get status category for UI styling
   */
  static getStatusCategory(portalStatus: string): string {
    const categories: Record<string, string> = {
      'Pre-Vet / New Lead': 'new',
      'Contacted': 'in_progress',
      'Sent for Signature / Submitted': 'waiting',
      'Approved': 'success',
      'Declined': 'rejected',
      'Dead / Withdrawn': 'closed'
    };
    return categories[portalStatus] || 'unknown';
  }

  /**
   * Check if a status is valid for the Portal
   */
  static isValidPortalStatus(status: string): boolean {
    return this.getAllPortalStatuses().includes(status);
  }
}

