/**
 * Status Mapping Service
 * Maps lead statuses between Portal display and Zoho CRM
 * 
 * Portal uses 6 user-friendly statuses
 * Zoho CRM uses various detailed statuses
 */

export class StatusMappingService {
  // Portal display values → Zoho CRM API values
  private static readonly portalToZoho: Record<string, string> = {
    'Pre-Vet / New Lead': 'Lead',
    'Contacted': 'Contacted',
    'Sent for Signature / Submitted': 'Application Submitted',
    'Approved': 'Approved',
    'Declined': 'Declined',
    'Dead / Withdrawn': 'Lost'
  };

  // Zoho CRM API values → Portal display values
  // Handles multiple Zoho statuses mapping to same Portal status
  private static readonly zohoToPortal: Record<string, string> = {
    // Pre-Vet / New Lead
    'Lead': 'Pre-Vet / New Lead',
    'New': 'Pre-Vet / New Lead',
    
    // Contacted
    'Contacted': 'Contacted',
    'Interested - Needs Follow-Up': 'Contacted',
    'Attempting to Contact': 'Contacted',
    'Contact in Future': 'Contacted',
    
    // Sent for Signature / Submitted
    'Application Submitted': 'Sent for Signature / Submitted',
    'Qualified': 'Sent for Signature / Submitted',
    
    // Approved
    'Approved': 'Approved',
    
    // Declined
    'Declined': 'Declined',
    'Not Qualified': 'Declined',
    
    // Dead / Withdrawn
    'Lost': 'Dead / Withdrawn',
    'Dead/Do Not Contact': 'Dead / Withdrawn',
    'Junk Lead': 'Dead / Withdrawn',
    'Not Contacted': 'Dead / Withdrawn'
  };

  /**
   * Map Portal status to Zoho CRM status
   * Used when sending data Portal → Zoho
   */
  static mapToZoho(portalStatus: string): string {
    const zohoStatus = this.portalToZoho[portalStatus];
    
    if (!zohoStatus) {
      console.warn(`[StatusMapping] Unknown Portal status: "${portalStatus}". Using as-is.`);
      return portalStatus;
    }
    
    return zohoStatus;
  }

  /**
   * Map Zoho CRM status to Portal display status
   * Used when receiving data Zoho → Portal
   */
  static mapFromZoho(zohoStatus: string): string {
    const portalStatus = this.zohoToPortal[zohoStatus];
    
    if (!portalStatus) {
      console.warn(`[StatusMapping] Unknown Zoho status: "${zohoStatus}". Using as-is.`);
      return zohoStatus;
    }
    
    return portalStatus;
  }

  /**
   * Get all valid Portal status values
   * Used for dropdowns and validation
   */
  static getAllPortalStatuses(): string[] {
    return Object.keys(this.portalToZoho);
  }

  /**
   * Get badge color for a Portal status
   * Used for UI styling
   */
  static getStatusColor(portalStatus: string): string {
    const colors: Record<string, string> = {
      'Pre-Vet / New Lead': 'blue',
      'Contacted': 'purple',
      'Sent for Signature / Submitted': 'yellow',
      'Approved': 'green',
      'Declined': 'red',
      'Dead / Withdrawn': 'gray'
    };
    
    return colors[portalStatus] || 'gray';
  }

  /**
   * Check if a status represents a final/closed state
   */
  static isFinalStatus(portalStatus: string): boolean {
    return [
      'Approved',
      'Declined',
      'Dead / Withdrawn'
    ].includes(portalStatus);
  }
}

