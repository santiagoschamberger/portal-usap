/**
 * Lead Status Mapping Service
 * Maps between Zoho CRM lead statuses and Portal display statuses
 * 
 * Client Requirements (December 2025):
 * - New -> New
 * - Contact Attempt 1-5 -> Contact Attempt
 * - Interested - Needs Follow Up -> Contacted - In Progress
 * - Sent Pre-App -> Contacted - In Progress
 * - Pre-App Received -> Contacted - In Progress
 * - Awaiting Signature - No Motion.io -> Sent for Signature
 * - Send to Motion.io -> Sent for Signature
 * - Signed Application -> Application Signed
 * - Notify Apps Team -> Application Signed
 * - Convert -> Application Signed
 * - Lost -> Lost
 * - Junk -> (Hidden/Filtered)
 * 
 * Reference: docs/reference/STATUS_STAGE_MAPPING_REFERENCE.md
 */

export class LeadStatusMappingService {
  /**
   * Portal display status → Zoho CRM status (for outbound updates)
   * Note: Portal typically doesn't update Zoho lead statuses, but this is here for completeness
   */
  private static portalToZoho: Record<string, string> = {
    'New': 'New',
    'Contact Attempt': 'Contact Attempt 1',
    'Contacted - In Progress': 'Interested - Needs Follow Up',
    'Sent for Signature': 'Send to Motion.io',
    'Application Signed': 'Signed Application',
    'Lost': 'Lost'
  };

  /**
   * Zoho CRM status → Portal display status (for inbound webhook updates)
   * This is the primary mapping used when Zoho sends status updates
   */
  private static zohoToPortal: Record<string, string> = {
    // New status
    'New': 'New',
    
    // Contact Attempt statuses (all map to "Contact Attempt")
    'Contact Attempt 1': 'Contact Attempt',
    'Contact Attempt 2': 'Contact Attempt',
    'Contact Attempt 3': 'Contact Attempt',
    'Contact Attempt 4': 'Contact Attempt',
    'Contact Attempt 5': 'Contact Attempt',
    
    // Contacted - In Progress statuses
    'Interested - Needs Follow Up': 'Contacted - In Progress',
    'Sent Pre-App': 'Contacted - In Progress',
    'Pre-App Received': 'Contacted - In Progress',
    
    // Sent for Signature statuses
    'Awaiting Signature - No Motion.io': 'Sent for Signature',
    'Send to Motion.io': 'Sent for Signature',
    
    // Application Signed statuses
    'Signed Application': 'Application Signed',
    'Notify Apps Team': 'Application Signed',
    'Convert': 'Application Signed',
    
    // Lost status
    'Lost': 'Lost',
    
    // Junk - mapped to Lost for now (can be filtered in UI)
    'Junk': 'Lost',
    
    // Converted status (lead converted to deal) - special handling
    'Converted': 'Converted' // This triggers lead deletion
  };

  /**
   * Map Portal status to Zoho CRM status (for outbound updates)
   */
  static mapToZoho(portalStatus: string): string {
    return this.portalToZoho[portalStatus] || 'New';
  }

  /**
   * Map Zoho CRM status to Portal display status (for inbound webhook updates)
   */
  static mapFromZoho(zohoStatus: string): string {
    if (!zohoStatus) return 'New';
    return this.zohoToPortal[zohoStatus] || 'New';
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
      'New': 'new',
      'Contact Attempt': 'in_progress',
      'Contacted - In Progress': 'in_progress',
      'Sent for Signature': 'waiting',
      'Application Signed': 'success',
      'Lost': 'closed'
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
    return zohoStatus === 'Converted' || zohoStatus === 'Converted - Deal' || zohoStatus === 'Convert';
  }
}

