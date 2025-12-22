/**
 * Deal Stage Mapping Service
 * Maps between Zoho CRM deal stages and Portal display stages
 * 
 * Client Requirements (December 2025):
 * - Sent to Underwriting -> In Underwriting
 * - App Pended -> In Underwriting
 * - Conditionally Approved -> Conditionally Approved
 * - Approved -> Approved
 * - App Withdrawn -> Lost
 * - Merchant Unresponsive -> Lost
 * - Dead/Do Not contact -> Lost
 * - Declined -> Declined
 * - Approved - Closed -> Closed
 * 
 * Reference: docs/reference/STATUS_STAGE_MAPPING_REFERENCE.md
 */
export class StageMappingService {
  private static zohoToPortal: Record<string, string> = {
    // In Underwriting group
    'Sent to Underwriting': 'In Underwriting',
    'App Pended': 'In Underwriting',
    
    // Conditionally Approved (separate from Approved per client requirements)
    'Conditionally Approved': 'Conditionally Approved',
    
    // Approved
    'Approved': 'Approved',
    
    // Lost group (all negative outcomes except Declined)
    'App Withdrawn': 'Lost',
    'Merchant Unresponsive': 'Lost',
    'Dead/Do Not contact': 'Lost',
    'Dead / Do Not Contact': 'Lost', // Handle both variations
    
    // Declined (separate from Lost per client requirements)
    'Declined': 'Declined',
    
    // Closed (final positive outcome)
    'Approved - Closed': 'Closed'
  };

  /**
   * Maps a Zoho deal stage to a Portal display stage
   */
  static mapFromZoho(zohoStage: string): string {
    if (!zohoStage) return 'In Underwriting';
    return this.zohoToPortal[zohoStage] || 'In Underwriting';
  }

  /**
   * Get all valid portal stages
   */
  static getAllPortalStages(): string[] {
    return [
      'In Underwriting',
      'Conditionally Approved',
      'Approved',
      'Lost',
      'Declined',
      'Closed'
    ];
  }
  
  /**
   * Get stage category for UI styling
   */
  static getStageCategory(portalStage: string): string {
    const categories: Record<string, string> = {
      'In Underwriting': 'review',
      'Conditionally Approved': 'conditional',
      'Approved': 'success',
      'Lost': 'closed',
      'Declined': 'rejected',
      'Closed': 'final'
    };
    return categories[portalStage] || 'unknown';
  }
}

