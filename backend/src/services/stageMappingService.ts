export class StageMappingService {
  private static zohoToPortal: Record<string, string> = {
    // New Lead / Prevet group
    'New Deal': 'New Lead / Prevet',
    'Pre-Vet': 'New Lead / Prevet',
    
    // Submitted group
    'Sent for Signature': 'Submitted',
    'Signed Application': 'Submitted',
    
    // Underwriting group
    'Sent to Underwriting': 'Underwriting',
    'App Pended': 'Underwriting',
    
    // Approved / Declined group
    'Approved': 'Approved',
    'Declined': 'Declined',
    'Conditionally Approved': 'Approved', // Mapped to Approved per plan
    
    // Closed group
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

