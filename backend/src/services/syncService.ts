/**
 * Daily Sync Service
 * Automatically syncs all partners' leads and deals from Zoho CRM
 */

import { supabaseAdmin } from '../config/database';
import { zohoService } from './zohoService';

interface SyncResult {
  partnerId: string;
  partnerName: string;
  leads: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
  };
  deals: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
  };
  errors: string[];
}

class SyncService {
  /**
   * Sync all partners' data from Zoho CRM
   * This runs daily via cron job
   */
  async syncAllPartners(): Promise<{
    success: boolean;
    totalPartners: number;
    successfulSyncs: number;
    results: SyncResult[];
    errors: string[];
  }> {
    console.log('🔄 Starting daily sync for all partners...');
    
    const results: SyncResult[] = [];
    const globalErrors: string[] = [];
    let successfulSyncs = 0;

    try {
      // Get all approved partners with Zoho partner IDs
      const { data: partners, error: partnersError } = await supabaseAdmin
        .from('partners')
        .select('id, name, zoho_partner_id, email')
        .eq('approved', true)
        .not('zoho_partner_id', 'is', null);

      if (partnersError) {
        throw new Error(`Failed to fetch partners: ${partnersError.message}`);
      }

      if (!partners || partners.length === 0) {
        console.log('ℹ️ No partners found for sync');
        return {
          success: true,
          totalPartners: 0,
          successfulSyncs: 0,
          results: [],
          errors: []
        };
      }

      console.log(`📊 Found ${partners.length} partners to sync`);

      // Sync each partner
      for (const partner of partners) {
        try {
          console.log(`🔄 Syncing partner: ${partner.name} (${partner.zoho_partner_id})`);
          
          const partnerResult = await this.syncPartnerData(partner);
          results.push(partnerResult);
          
          if (partnerResult.errors.length === 0) {
            successfulSyncs++;
          }
          
          // Small delay between partners to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          const errorMsg = `Failed to sync partner ${partner.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('❌', errorMsg);
          globalErrors.push(errorMsg);
          
          results.push({
            partnerId: partner.id,
            partnerName: partner.name,
            leads: { total: 0, created: 0, updated: 0, skipped: 0 },
            deals: { total: 0, created: 0, updated: 0, skipped: 0 },
            errors: [errorMsg]
          });
        }
      }

      // Log sync activity
      await this.logSyncActivity(results, globalErrors);

      console.log(`✅ Daily sync completed: ${successfulSyncs}/${partners.length} partners synced successfully`);

      return {
        success: globalErrors.length === 0,
        totalPartners: partners.length,
        successfulSyncs,
        results,
        errors: globalErrors
      };

    } catch (error) {
      const errorMsg = `Daily sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMsg);
      globalErrors.push(errorMsg);
      
      return {
        success: false,
        totalPartners: 0,
        successfulSyncs: 0,
        results,
        errors: globalErrors
      };
    }
  }

  /**
   * Sync a single partner's leads and deals
   */
  private async syncPartnerData(partner: {
    id: string;
    name: string;
    zoho_partner_id: string;
    email: string;
  }): Promise<SyncResult> {
    const result: SyncResult = {
      partnerId: partner.id,
      partnerName: partner.name,
      leads: { total: 0, created: 0, updated: 0, skipped: 0 },
      deals: { total: 0, created: 0, updated: 0, skipped: 0 },
      errors: []
    };

    try {
      // Sync leads
      console.log(`  📋 Syncing leads for ${partner.name}...`);
      const leadsResult = await this.syncPartnerLeads(partner);
      result.leads = leadsResult;

      // Sync deals
      console.log(`  💼 Syncing deals for ${partner.name}...`);
      const dealsResult = await this.syncPartnerDeals(partner);
      result.deals = dealsResult;

      // Update partner's last sync timestamp
      await supabaseAdmin
        .from('partners')
        .update({ 
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id);

      console.log(`  ✅ ${partner.name}: ${result.leads.created + result.leads.updated} leads, ${result.deals.created + result.deals.updated} deals processed`);

    } catch (error) {
      const errorMsg = `Sync failed for ${partner.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error('  ❌', errorMsg);
    }

    return result;
  }

  /**
   * Sync leads for a specific partner
   */
  private async syncPartnerLeads(partner: {
    id: string;
    zoho_partner_id: string;
  }): Promise<{ total: number; created: number; updated: number; skipped: number }> {
    try {
      // Fetch leads from Zoho CRM by vendor ID
      const zohoResponse = await zohoService.getLeadsByVendor(partner.zoho_partner_id);

      if (!zohoResponse.data || zohoResponse.data.length === 0) {
        return { total: 0, created: 0, updated: 0, skipped: 0 };
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;

      // Process each lead from Zoho
      for (const zohoLead of zohoResponse.data) {
        try {
          const email = zohoLead.Email?.toLowerCase();
          if (!email || !zohoLead.First_Name || !zohoLead.Last_Name) {
            skipped++;
            continue;
          }

          // Map Zoho lead status to our local status
          const statusMap: { [key: string]: string } = {
            'New': 'new',
            'Contacted': 'contacted',
            'Qualified': 'qualified',
            'Proposal': 'proposal',
            'Negotiation': 'negotiation',
            'Closed Won': 'closed_won',
            'Closed Lost': 'closed_lost',
            'Nurture': 'nurture',
            'Unqualified': 'unqualified'
          };
          
          const localStatus = statusMap[zohoLead.Lead_Status] || 'new';

          // Check if lead already exists (multiple ways to prevent duplicates)
          let existingLead = null;
          
          // First, try to find by zoho_lead_id
          if (zohoLead.id) {
            const { data: leadByZohoId } = await supabaseAdmin
              .from('leads')
              .select('id, status, zoho_lead_id, email')
              .eq('zoho_lead_id', zohoLead.id)
              .single();
            
            if (leadByZohoId) {
              existingLead = leadByZohoId;
            }
          }
          
          // If not found by zoho_lead_id, try by email + partner combination
          if (!existingLead) {
            const { data: leadByEmail } = await supabaseAdmin
              .from('leads')
              .select('id, status, zoho_lead_id, email')
              .eq('email', email)
              .eq('partner_id', partner.id)
              .single();
              
            if (leadByEmail) {
              existingLead = leadByEmail;
              
              // Update the zoho_lead_id if it was missing
              if (!leadByEmail.zoho_lead_id && zohoLead.id) {
                await supabaseAdmin
                  .from('leads')
                  .update({ zoho_lead_id: zohoLead.id })
                  .eq('id', leadByEmail.id);
              }
            }
          }

          if (existingLead) {
            // Update existing lead
            await supabaseAdmin
              .from('leads')
              .update({
                first_name: zohoLead.First_Name,
                last_name: zohoLead.Last_Name,
                email: email,
                phone: zohoLead.Phone || null,
                company: zohoLead.Company || null,
                status: localStatus,
                lead_source: zohoLead.Lead_Source || 'zoho_sync',
                zoho_sync_status: 'synced',
                last_sync_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', existingLead.id);

            updated++;
          } else {
            // Create new lead - need to find a main user for created_by
            const { data: mainUser } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('partner_id', partner.id)
              .eq('role', 'admin')
              .single();

            await supabaseAdmin
              .from('leads')
              .insert({
                partner_id: partner.id,
                zoho_lead_id: zohoLead.id,
                first_name: zohoLead.First_Name,
                last_name: zohoLead.Last_Name,
                email: email,
                phone: zohoLead.Phone || null,
                company: zohoLead.Company || null,
                status: localStatus,
                lead_source: zohoLead.Lead_Source || 'zoho_sync',
                priority: 'medium',
                score: 0,
                zoho_sync_status: 'synced',
                last_sync_at: new Date().toISOString(),
                created_by: mainUser?.id || null
              });

            created++;
          }
        } catch (error) {
          console.error(`Error processing lead ${zohoLead.id}:`, error);
          skipped++;
        }
      }

      return {
        total: zohoResponse.data.length,
        created,
        updated,
        skipped
      };

    } catch (error) {
      console.error('Error syncing partner leads:', error);
      throw error;
    }
  }

  /**
   * Sync deals for a specific partner
   */
  private async syncPartnerDeals(partner: {
    id: string;
    zoho_partner_id: string;
  }): Promise<{ total: number; created: number; updated: number; skipped: number }> {
    try {
      // Fetch deals from Zoho CRM by vendor ID
      const zohoResponse = await zohoService.getDealsByVendor(partner.zoho_partner_id);

      if (!zohoResponse.data || zohoResponse.data.length === 0) {
        return { total: 0, created: 0, updated: 0, skipped: 0 };
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;

      // Process each deal from Zoho
      for (const zohoDeal of zohoResponse.data) {
        try {
          if (!zohoDeal.Deal_Name) {
            skipped++;
            continue;
          }

          // Map Zoho deal stage to our local stage
          // Updated with actual stages from Zoho CRM API
          const stageMap: { [key: string]: string } = {
            'New Deal': 'New Deal',
            'Pre-Vet': 'Pre-Vet',
            'Sent for Signature': 'Sent for Signature',
            'Signed Application': 'Signed Application',
            'Sent to Underwriting': 'Sent to Underwriting',
            'App Pended': 'App Pended',
            'Approved': 'Approved',
            'Declined': 'Declined',
            'Dead / Do Not Contact': 'Dead / Do Not Contact',
            'Merchant Unresponsive': 'Merchant Unresponsive',
            'App Withdrawn': 'App Withdrawn',
            'Approved - Closed': 'Approved - Closed',
            'Conditionally Approved': 'Conditionally Approved'
          };

          const localStage = stageMap[zohoDeal.Stage] || 'New Deal';

          // Check if deal already exists
          const { data: existingDeal } = await supabaseAdmin
            .from('deals')
            .select('id, stage')
            .eq('zoho_deal_id', zohoDeal.id)
            .single();

          // Find main user for created_by
          const { data: mainUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('partner_id', partner.id)
            .eq('role', 'admin')
            .single();

          const dealData = {
            deal_name: zohoDeal.Deal_Name,
            first_name: zohoDeal.Contact_First_Name || null,
            last_name: zohoDeal.Contact_Name?.split(' ').slice(1).join(' ') || null,
            email: null, // Would need to add if available in Zoho
            phone: null, // Would need to add if available in Zoho
            company: zohoDeal.Business_Name || zohoDeal.Deal_Name,
            amount: 0, // Default to 0 as requested
            stage: localStage,
            approval_date: zohoDeal.Approval_Time_Stamp || null, // Map from Zoho Approval Time Stamp field
            lead_source: zohoDeal.Lead_Source || 'zoho_sync',
            zoho_sync_status: 'synced',
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          if (existingDeal) {
            // Update existing deal
            await supabaseAdmin
              .from('deals')
              .update(dealData)
              .eq('id', existingDeal.id);

            updated++;
          } else {
            // Create new deal
            await supabaseAdmin
              .from('deals')
              .insert({
                ...dealData,
                partner_id: partner.id,
                zoho_deal_id: zohoDeal.id,
                created_by: mainUser?.id || null
              });

            created++;
          }
        } catch (error) {
          console.error(`Error processing deal ${zohoDeal.id}:`, error);
          skipped++;
        }
      }

      return {
        total: zohoResponse.data.length,
        created,
        updated,
        skipped
      };

    } catch (error) {
      console.error('Error syncing partner deals:', error);
      throw error;
    }
  }

  /**
   * Log sync activity for audit purposes
   */
  private async logSyncActivity(results: SyncResult[], errors: string[]): Promise<void> {
    try {
      const totalLeads = results.reduce((sum, r) => sum + r.leads.created + r.leads.updated, 0);
      const totalDeals = results.reduce((sum, r) => sum + r.deals.created + r.deals.updated, 0);
      
      // Log to activity_log table
      await supabaseAdmin.from('activity_log').insert({
        partner_id: null, // System-level activity
        user_id: null,
        entity_type: 'system',
        entity_id: null,
        action: 'daily_sync_completed',
        description: `Daily sync completed: ${totalLeads} leads, ${totalDeals} deals processed across ${results.length} partners`,
        metadata: {
          sync_timestamp: new Date().toISOString(),
          total_partners: results.length,
          successful_partners: results.filter(r => r.errors.length === 0).length,
          total_leads_processed: totalLeads,
          total_deals_processed: totalDeals,
          errors: errors,
          results: results.map(r => ({
            partner: r.partnerName,
            leads: r.leads,
            deals: r.deals,
            errors: r.errors
          }))
        }
      });

      console.log(`📝 Sync activity logged: ${totalLeads} leads, ${totalDeals} deals processed`);
    } catch (error) {
      console.error('Failed to log sync activity:', error);
    }
  }

  /**
   * Manual trigger for testing - can be called via API endpoint
   */
  async triggerManualSync(): Promise<any> {
    console.log('🔄 Manual sync triggered...');
    return await this.syncAllPartners();
  }
}

export const syncService = new SyncService();
