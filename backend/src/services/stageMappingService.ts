/**
 * Deal Stage Mapping Service
 * Maps between Zoho CRM deal stages and Portal display stages
 * 
 * Zoho Deal Stages (from CRM):
 * - Sent to Underwriting (75%, Open, Pipeline)
 * - App Pended (90%, Open, Pipeline)
 * - Approved (100%, Closed Won, Closed)
 * - Approved - Closed (0%, Closed Lost, Omitted)
 * - Declined (0%, Closed Lost, Omitted)
 * - Dead / Do Not Contact (0%, Closed Lost, Omitted)
 * - Merchant Unresponsive (0%, Closed Lost, Omitted)
 * - App Withdrawn (0%, Closed Lost, Omitted)
 * - Conditionally Approved (95%, Open, Pipeline)
 */
export class StageMappingService {
  private static zohoToPortal: Record<string, string> = {
    // New Lead / Prevet group (initial stages)
    'New Deal': 'New Lead / Prevet',
    'Pre-Vet': 'New Lead / Prevet',
    
    // Submitted group (application sent/signed)
    'Sent for Signature': 'Submitted',
    'Signed Application': 'Submitted',
    
    // Underwriting group (Open/Pipeline - 75-90%)
    'Sent to Underwriting': 'Underwriting',
    'App Pended': 'Underwriting',
    
    // Approved group (Closed Won - 100% OR Conditionally Approved - 95%)
    'Approved': 'Approved',
    'Conditionally Approved': 'Approved',
    
    // Declined group (Closed Lost - 0%)
    'Declined': 'Declined',
    
    // Closed group (Closed Lost - 0%, Omitted from forecast)
    'Approved - Closed': 'Closed',
    'Dead / Do Not Contact': 'Closed',
    'Merchant Unresponsive': 'Closed',
    'App Withdrawn': 'Closed'
  };

  /**
   * Maps a Zoho deal stage to a Portal display stage
   */
  static mapFromZoho(zohoStage: string): string {
    if (!zohoStage) return 'New Lead / Prevet';
    return this.zohoToPortal[zohoStage] || 'New Lead / Prevet';
  }

  /**
   * Get all valid portal stages
   */
  static getAllPortalStages(): string[] {
    return [
      'New Lead / Prevet',
      'Submitted',
      'Underwriting',
      'Approved',
      'Declined',
      'Closed'
    ];
  }
}

