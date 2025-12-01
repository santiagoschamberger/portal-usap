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
    // Base mappings
    'Lead': 'Pre-Vet / New Lead',
    'Contacted': 'Contacted',
    'Application Submitted': 'Sent for Signature / Submitted',
    'Approved': 'Approved',
    'Declined': 'Declined',
    
    // All Zoho Lead Statuses (Open category)
    'New': 'Pre-Vet / New Lead',
    'Contact Attempt 1': 'Contacted',
    'Contact Attempt 2': 'Contacted',
    'Interested': 'Contacted',
    'Reset Appointment': 'Contacted',
    'Sent Agreement for Signature': 'Sent for Signature / Submitted',
    'Signed Agreement': 'Sent for Signature / Submitted', // Should trigger conversion
    'Contacted - Needs Follow up': 'Contacted',
    'Needs Follow Up': 'Contacted',
    'Interested - SP Lead': 'Contacted',
    'Interested - Merchant Lead': 'Contacted',
    'Interested - Needs Follow Up': 'Contacted',
    
    // Not Qualified category
    'Lost': 'Dead / Withdrawn',
    
    // Converted status (lead converted to deal)
    'Converted': 'Converted', // Special status - lead should be removed
    
    // Legacy/Additional statuses
    'Pre-Vet': 'Pre-Vet / New Lead',
    'Qualified': 'Contacted',
    'Unqualified': 'Dead / Withdrawn',
    'Junk Lead': 'Dead / Withdrawn',
    'Not Contacted': 'Pre-Vet / New Lead',
    'Sent Pre-App': 'Contacted',
    'sent pre-app': 'Contacted',
    'Pre-App Sent': 'Contacted',
    'Sent for Signature': 'Sent for Signature / Submitted',
    'Signature Sent': 'Sent for Signature / Submitted',
    // NOTE: "Signed Agreement" and "Signed Application" should trigger lead-to-deal conversion in Zoho
    'Signed Application': 'Sent for Signature / Submitted'
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

  /**
   * Check if a Zoho status indicates the lead has been converted to a deal
   */
  static isConvertedStatus(zohoStatus: string): boolean {
    return zohoStatus === 'Converted' || zohoStatus === 'Converted - Deal';
  }
}

