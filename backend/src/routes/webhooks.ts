import { Router } from 'express';
import { supabase, supabaseAdmin } from '../config/database';
import { zohoService } from '../services/zohoService';
import { LeadStatusMappingService } from '../services/leadStatusMappingService';
import { StageMappingService } from '../services/stageMappingService';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/webhooks/zoho/partner
 * Webhook for partner approval in Zoho CRM
 * Creates portal user when partner is approved
 */
router.post('/zoho/partner', async (req, res) => {
  try {
    const { id, VendorName, Email } = req.body;

    console.log('Partner webhook received:', { id, VendorName, Email });

    // Use the security definer function to create the partner and user
    const { data, error } = await supabase.rpc('create_partner_with_user', {
      p_zoho_partner_id: id,
      p_name: VendorName,
      p_email: Email,
    });

    if (error) {
      console.error('Error creating partner via function:', error);
      return res.status(500).json({
        error: 'Failed to create partner',
        details: error.message,
      });
    }
    
    // Log activity
    await supabase.from('activity_log').insert({
      partner_id: data[0].partner_id,
      user_id: data[0].user_id,
      activity_type: 'partner_created',
      description: `Partner ${VendorName} created via Zoho webhook`,
      metadata: { zoho_partner_id: id }
    });

    // TODO: Send welcome email with login instructions
    
    return res.status(201).json({
      success: true,
      message: 'Partner and user created successfully',
      data: {
        partner_id: data[0].partner_id,
        user_id: data[0].user_id,
        email: Email
      }
    });
  } catch (error) {
    console.error('Partner webhook error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/webhooks/zoho/lead-status
 * Webhook for lead status updates from Zoho CRM
 */
router.post('/zoho/lead-status', async (req, res) => {
  try {
    const { id: zohoLeadId, Lead_Status, StrategicPartnerId } = req.body;

    console.log('Lead status webhook received:', { zohoLeadId, Lead_Status, StrategicPartnerId });

    // Find the lead in our database using admin client to bypass RLS
    // Also fetch created_by to use as StrategicPartnerId (webhook may not include it)
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('id, partner_id, status, created_by, first_name, last_name, email')
      .eq('zoho_lead_id', zohoLeadId)
      .single();

    if (leadError || !lead) {
      console.error('Lead not found in local database:', { zohoLeadId, error: leadError });
      return res.status(404).json({
        error: 'Lead not found',
        zoho_lead_id: zohoLeadId,
        details: leadError?.message
      });
    }

    // Use local database's created_by as StrategicPartnerId if webhook didn't provide it
    const strategicPartnerId = StrategicPartnerId || lead.created_by;
    
    console.log(`✅ Lead found: ${lead.first_name} ${lead.last_name} (${lead.email})`);
    console.log(`   Partner ID: ${lead.partner_id}`);
    console.log(`   Created By (StrategicPartnerId): ${strategicPartnerId}`);

    const oldStatus = lead.status;
    
    // Check if lead has been converted to a deal
    if (LeadStatusMappingService.isConvertedStatus(Lead_Status)) {
      console.log(`🔄 Lead converted to deal - removing from leads table`);
      
      // Delete the lead from leads table
      const { error: deleteError } = await supabaseAdmin
        .from('leads')
        .delete()
        .eq('id', lead.id);
      
      if (deleteError) {
        console.error('Error deleting converted lead:', deleteError);
        return res.status(500).json({
          error: 'Failed to delete converted lead',
          details: deleteError.message
        });
      }
      
      // Clean up lead status history
      await supabaseAdmin
        .from('lead_status_history')
        .delete()
        .eq('lead_id', lead.id);
      
      // Log activity
      await supabaseAdmin.from('activity_log').insert({
        partner_id: lead.partner_id,
        user_id: strategicPartnerId,
        activity_type: 'lead_converted',
        description: `Lead "${lead.first_name} ${lead.last_name}" converted to deal and removed from leads`,
        metadata: { 
          source: 'zoho_webhook',
          zoho_lead_id: zohoLeadId,
          zoho_status: Lead_Status,
          strategic_partner_id: strategicPartnerId
        }
      });
      
      console.log(`✅ Lead ${lead.id} successfully removed after conversion`);
      
      return res.status(200).json({
        success: true,
        message: 'Lead converted to deal and removed from leads table',
        data: {
          lead_id: lead.id,
          action: 'deleted',
          reason: 'converted_to_deal'
        }
      });
    }
    
    // Use LeadStatusMappingService to map Zoho status to Portal display status
    const newStatus = LeadStatusMappingService.mapFromZoho(Lead_Status);

    console.log(`📊 Lead Status Webhook - Mapping: Zoho "${Lead_Status}" → Portal "${newStatus}"`);

    // Update lead status if it has changed
    if (oldStatus !== newStatus) {
      const { error: updateError } = await supabaseAdmin
        .from('leads')
        .update({
          status: newStatus,
          zoho_status: Lead_Status, // Store original Zoho status for reference
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (updateError) {
        console.error('Error updating lead status:', updateError);
        return res.status(500).json({
          error: 'Failed to update lead status',
          details: updateError.message
        });
      }

      // REQUIREMENT: Delete previous status history records (keep only 1 record per lead)
      await supabaseAdmin
        .from('lead_status_history')
        .delete()
        .eq('lead_id', lead.id);

      // Add new status history record (only the current one)
      await supabaseAdmin.from('lead_status_history').insert({
        lead_id: lead.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: 'zoho_webhook',
        notes: `Status updated via Zoho CRM webhook (Zoho: "${Lead_Status}")`
      });

      // Log activity with StrategicPartnerId
      await supabaseAdmin.from('activity_log').insert({
        partner_id: lead.partner_id,
        user_id: strategicPartnerId, // Log which user's lead this is
        lead_id: lead.id,
        activity_type: 'lead_status_updated',
        description: `Lead status changed from "${oldStatus}" to "${newStatus}" via Zoho CRM`,
        metadata: { 
          source: 'zoho_webhook',
          zoho_lead_id: zohoLeadId,
          zoho_status: Lead_Status,
          old_status: oldStatus,
          new_status: newStatus,
          strategic_partner_id: strategicPartnerId
        }
      });

      // TODO: Send notification to partner about status change
      // This could trigger real-time updates via Socket.IO
    }

    return res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
      data: {
        lead_id: lead.id,
        old_status: oldStatus,
        new_status: newStatus,
        zoho_status: Lead_Status
      }
    });
  } catch (error) {
    console.error('Lead status webhook error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/webhooks/zoho/contact
 * Webhook for contact creation (sub-accounts)
 * Only creates sub-account if the parent partner already exists in the portal
 * 
 * Supports TWO formats:
 * 
 * 1. Module Parameters (preferred for contacts):
 *    - fullname: Contact Name
 *    - email: Email
 *    - parentid: Partner ID (zoho_partner_id)
 *    - partnerid: Contact ID
 * 
 * 2. JSON Body (for compatibility with other webhooks):
 *    - First_Name, Last_Name: Contact name parts
 *    - Email: Contact email
 *    - Vendor.id or Account_Name.id: Partner ID
 *    - id: Contact ID
 */
router.post('/zoho/contact', async (req, res) => {
  try {
    // Zoho sends module parameters as HEADERS (not body) when using "General" auth
    // Support both headers (module parameters) and body (JSON format)
    const fullname = req.headers.fullname as string || req.body.fullname || `${req.body.First_Name || ''} ${req.body.Last_Name || ''}`.trim();
    const email = req.headers.email as string || req.body.email || req.body.Email;
    const parentid = req.headers.parentid as string || req.body.parentid || req.body.Vendor?.id || req.body.Account_Name?.id;
    const contactId = req.headers.partnerid as string || req.body.partnerid || req.body.id;

    // Split fullname into first and last name
    // If using JSON format with separate First_Name/Last_Name, use those directly
    let firstName, lastName;
    if (req.body.First_Name && req.body.Last_Name) {
      firstName = req.body.First_Name;
      lastName = req.body.Last_Name;
    } else {
      const nameParts = fullname.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
    }

    console.log('Contact webhook received:', { 
      format: req.headers.fullname ? 'headers (module-parameters)' : 'body (json)',
      contactId,
      fullname,
      firstName,
      lastName,
      email,
      parentid,
      source: req.headers.fullname ? 'headers' : 'body'
    });

    // Validate required fields
    if (!email || (!fullname && !firstName)) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'fullname or First_Name/Last_Name'],
        received: req.body
      });
    }

    // IMPORTANT: Sub-accounts should NOT be created automatically from Zoho contacts
    // Sub-accounts should only be created manually by the main partner through the portal
    // This webhook is kept for potential future use, but currently disabled
    console.log('ℹ️  Contact webhook received but automatic sub-account creation is DISABLED');
    console.log('   Sub-accounts should be created manually by partners through the portal');
    console.log('   Contact info:', { firstName, lastName, email, parentid });
    
    return res.status(200).json({
      success: true,
      message: 'Contact webhook received but automatic sub-account creation is disabled',
      note: 'Sub-accounts should be created manually by partners through the portal',
      contact: { firstName, lastName, email }
    });
  } catch (error) {
    console.error('Contact webhook error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/webhooks/zoho/deal
 * Webhook for deal creation/update in Zoho CRM
 * This fires when a lead is converted to a deal or when a deal is created/updated
 */
router.post('/zoho/deal', async (req, res) => {
  try {
    // Log the FULL request body to see what Zoho is actually sending
    console.log('📦 Deal webhook - FULL BODY:', JSON.stringify(req.body, null, 2));
    
    const {
      zohoDealId, // Zoho sends it as "zohoDealId" not "id"
      Deal_Name,
      Stage,
      Lead_Source,
      Business_Name,
      Contact_First_Name,
      Contact_Name,
      First_Name, // Zoho sends these separately
      Last_Name,
      Email, // Email field from deal
      Phone, // Phone field from deal
      Partners_Id, // From ${Lookup:Partner.Partners Id}
      StrategicPartnerId, // This is the PARTNER ID in this webhook (not user ID!)
      Approval_Time_Stamp, // Approval date field from Zoho
      Vendor, // Vendor object (contains partner info)
      Account_Name // Account Name (string, not object)
    } = req.body;

    console.log('Deal webhook received:', {
      zohoDealId,
      Deal_Name,
      Stage,
      Email,
      Phone,
      Partners_Id,
      StrategicPartnerId,
      Vendor,
      Account_Name
    });
    
    // Extract partner ID from multiple possible sources
    // Based on the logs, StrategicPartnerId contains the partner's Zoho ID
    const vendorId = Partners_Id || StrategicPartnerId || Vendor?.id;
    
    if (!vendorId) {
      console.error('❌ No partner identifier found in webhook payload');
      console.error('   Checked: Partners_Id, StrategicPartnerId, Vendor.id');
      console.error('   Available fields:', Object.keys(req.body));
      return res.status(400).json({
        error: 'Partner identifier missing',
        message: 'Webhook must include Partners_Id, StrategicPartnerId, or Vendor.id',
        debug: {
          available_fields: Object.keys(req.body)
        }
      });
    }
    
    console.log(`✅ Using partner identifier: ${vendorId}`);

    // Extract contact info FIRST (needed for partner lookup)
    const accountName = Business_Name || Deal_Name || Account_Name || 'Unknown';
    const contactName = Contact_Name || '';
    
    // Zoho sends First_Name and Last_Name separately in this webhook
    const firstName = First_Name || Contact_First_Name || contactName.split(' ')[0] || null;
    const lastName = Last_Name || contactName.split(' ').slice(1).join(' ') || null;
    const email = Email || null; // Email from Zoho deal
    const phone = Phone || null; // Phone from Zoho deal
    
    console.log('📧 Contact details extracted:', { firstName, lastName, email, phone, accountName });

    // Find the partner using vendorId (from multiple possible sources)
    let partnerId: string | null = null;
    let createdBy: string | null = null;

    if (vendorId) {
      console.log(`🔍 Looking up partner with Zoho ID: ${vendorId}`);
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('id')
        .eq('zoho_partner_id', vendorId)
        .single();

      if (partner) {
        partnerId = partner.id;
        console.log(`✅ Partner found: ${partnerId}`);
        
        // Try to find the original lead creator by matching deal details
        if (firstName && lastName) {
          const { data: matchingLead } = await supabaseAdmin
            .from('leads')
            .select('created_by, id, email')
            .eq('partner_id', partner.id)
            .eq('first_name', firstName)
            .eq('last_name', lastName)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (matchingLead && matchingLead.created_by) {
            createdBy = matchingLead.created_by;
            console.log(`✅ Found original lead creator: ${createdBy} (lead: ${matchingLead.id})`);
          }
        }
        
        // If no lead creator found, use the main partner admin user
        if (!createdBy) {
          const { data: mainUser } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('partner_id', partner.id)
            .eq('role', 'admin') // Main partner account
            .maybeSingle();
            
          if (mainUser) {
            createdBy = mainUser.id;
            console.log(`✅ Using main partner admin: ${createdBy} (${mainUser.email})`);
          } else {
            console.warn('⚠️ No admin user found for partner, deal will have no created_by');
          }
        }
      }
    }

    // If still no partner found, can't proceed
    if (!partnerId) {
      console.error('❌ No partner found for deal');
      console.error('   Searched with Zoho ID:', vendorId);
      console.error('   Available request body:', Object.keys(req.body));
      return res.status(400).json({
        error: 'Partner not found',
        message: 'Could not link deal to a partner in the portal',
        debug: {
          vendorId,
          available_fields: Object.keys(req.body)
        }
      });
    }

    // Map Zoho deal stage to our local stage using StageMappingService
    const localStage = StageMappingService.mapFromZoho(Stage);

    // Check if deal already exists
    const { data: existingDeal } = await supabaseAdmin
      .from('deals')
      .select('id, stage')
      .eq('zoho_deal_id', zohoDealId)
      .single();

    const dealData = {
      deal_name: Deal_Name || accountName,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      company: accountName,
      amount: 0, // Default to 0 since we're not tracking amount
      stage: localStage,
      approval_date: Approval_Time_Stamp || null, // Map from Zoho Approval Time Stamp field
      lead_source: Lead_Source || 'zoho_sync',
      zoho_sync_status: 'synced',
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingDeal) {
      // Update existing deal
      const { error: updateError } = await supabaseAdmin
        .from('deals')
        .update(dealData)
        .eq('id', existingDeal.id);

      if (updateError) {
        console.error('Error updating deal:', updateError);
        return res.status(500).json({
          error: 'Failed to update deal',
          details: updateError.message
        });
      }

      // REQUIREMENT: Delete previous stage history records (keep only 1 record per deal)
      if (existingDeal.stage !== localStage) {
        await supabaseAdmin
          .from('deal_stage_history')
          .delete()
          .eq('deal_id', existingDeal.id);

        // Add new stage history record (only the current one)
        await supabaseAdmin.from('deal_stage_history').insert({
          deal_id: existingDeal.id,
          old_stage: existingDeal.stage,
          new_stage: localStage,
          notes: 'Stage updated via Zoho webhook'
        });
      }

      // IMPORTANT: Also check for lead conversion on deal UPDATE
      // Sometimes Zoho creates the deal first, then sends an update with contact info
      console.log('🔍 Checking for lead conversion on deal update...');
      console.log('   Search criteria:', { partnerId, email, firstName, lastName, accountName });
      
      if (partnerId && (email || (firstName && lastName))) {
        let matchingLead = null;
        
        // Strategy 1: Try by email (most reliable)
        if (email) {
          const { data: leadByEmail } = await supabaseAdmin
            .from('leads')
            .select('id, zoho_lead_id, first_name, last_name, email')
            .eq('partner_id', partnerId)
            .eq('email', email)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (leadByEmail) {
            matchingLead = leadByEmail;
            console.log(`✓ Found lead by email: ${email}`);
          }
        }
        
        // Strategy 2: Try by name + company
        if (!matchingLead && firstName && lastName && accountName) {
          const { data: leadByNameCompany } = await supabaseAdmin
            .from('leads')
            .select('id, zoho_lead_id, first_name, last_name, email')
            .eq('partner_id', partnerId)
            .eq('first_name', firstName)
            .eq('last_name', lastName)
            .eq('company', accountName)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (leadByNameCompany) {
            matchingLead = leadByNameCompany;
            console.log(`✓ Found lead by name + company: ${firstName} ${lastName} at ${accountName}`);
          }
        }
        
        // If we found a matching lead, delete it
        if (matchingLead) {
          console.log(`🔄 Found matching lead for conversion: ${matchingLead.id}`);
          
          const { error: deleteLeadError } = await supabaseAdmin
            .from('leads')
            .delete()
            .eq('id', matchingLead.id);

          if (deleteLeadError) {
            console.error('Error deleting converted lead:', deleteLeadError);
          } else {
            console.log(`✅ Successfully removed converted lead ${matchingLead.id} from leads table`);
            
            // Clean up lead status history
            await supabaseAdmin
              .from('lead_status_history')
              .delete()
              .eq('lead_id', matchingLead.id);
          }
        } else {
          console.log('⚠️ No matching lead found for this deal update');
        }
      }

      // Log activity
      await supabaseAdmin.from('activity_log').insert({
        partner_id: partnerId,
        user_id: createdBy,
        entity_type: 'deal',
        entity_id: existingDeal.id,
        action: 'deal_updated',
        description: `Deal ${Deal_Name} updated via Zoho webhook`,
        metadata: {
          zoho_deal_id: zohoDealId,
          stage: localStage
        }
      });

      console.log('Deal updated successfully:', existingDeal.id);

      return res.status(200).json({
        success: true,
        message: 'Deal updated successfully',
        data: {
          deal_id: existingDeal.id,
          zoho_deal_id: zohoDealId,
          stage: localStage
        }
      });
    } else {
      // REQUIREMENT: When creating a new deal, check if this is a lead conversion
      // and remove the corresponding lead from the leads table
      let convertedLeadId: string | null = null;
      
      console.log('🔍 Checking for lead conversion...');
      console.log('   Search criteria:', { partnerId, email, firstName, lastName, accountName });
      
      // Try to find matching lead by partner and contact details
      // Try multiple strategies to find the matching lead
      let matchingLead = null;
      
      if (partnerId) {
        // Strategy 1: Try by email (most reliable if available)
        if (email) {
          const { data: leadByEmail } = await supabaseAdmin
            .from('leads')
            .select('id, zoho_lead_id, first_name, last_name')
            .eq('partner_id', partnerId)
            .eq('email', email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (leadByEmail) {
            matchingLead = leadByEmail;
            console.log(`✓ Found lead by email: ${email}`);
          }
        }
        
        // Strategy 2: Try by first_name + last_name + company
        if (!matchingLead && firstName && lastName && accountName) {
          const { data: leadByNameCompany } = await supabaseAdmin
            .from('leads')
            .select('id, zoho_lead_id, first_name, last_name')
            .eq('partner_id', partnerId)
            .eq('first_name', firstName)
            .eq('last_name', lastName)
            .eq('company', accountName)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (leadByNameCompany) {
            matchingLead = leadByNameCompany;
            console.log(`✓ Found lead by name + company: ${firstName} ${lastName} at ${accountName}`);
          }
        }
        
        // Strategy 3: Try by first_name + last_name only (fallback)
        if (!matchingLead && firstName && lastName) {
          const { data: leadByName } = await supabaseAdmin
            .from('leads')
            .select('id, zoho_lead_id, first_name, last_name')
            .eq('partner_id', partnerId)
            .eq('first_name', firstName)
            .eq('last_name', lastName)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (leadByName) {
            matchingLead = leadByName;
            console.log(`✓ Found lead by name only: ${firstName} ${lastName}`);
          }
        }

        if (matchingLead) {
          convertedLeadId = matchingLead.id;
          console.log(`Found matching lead for conversion: ${matchingLead.id} (Zoho ID: ${matchingLead.zoho_lead_id})`);
          
          // REQUIREMENT: Remove the lead from leads table when converting to deal
          const { error: deleteLeadError } = await supabaseAdmin
            .from('leads')
            .delete()
            .eq('id', matchingLead.id);

          if (deleteLeadError) {
            console.error('Error deleting converted lead:', deleteLeadError);
            // Continue anyway - deal creation is more important
          } else {
            console.log(`✅ Successfully removed converted lead ${matchingLead.id} from leads table`);
            
            // Also clean up lead status history for the deleted lead
            await supabaseAdmin
              .from('lead_status_history')
              .delete()
              .eq('lead_id', matchingLead.id);
            
            // Create notification for the user who created the lead
            if (createdBy) {
              await supabaseAdmin.from('notifications').insert({
                user_id: createdBy,
                partner_id: partnerId,
                type: 'lead_converted',
                title: 'Lead Converted to Deal! 🎉',
                message: `Your lead "${firstName} ${lastName}" has been converted to a deal and moved to the Deals section. You can now track its progress through the approval stages.`,
                metadata: {
                  lead_id: matchingLead.id,
                  deal_name: Deal_Name,
                  stage: localStage,
                  zoho_deal_id: zohoDealId
                }
              });
              console.log(`✅ Created notification for user ${createdBy} about lead conversion`);
            }
          }
        } else {
          console.log('⚠️ No matching lead found for conversion');
          console.log('   This might be a direct deal creation (not from lead conversion)');
        }
      } else {
        console.log('⚠️ No partner ID available - skipping lead conversion check');
      }

      // Create new deal
      const { data: newDeal, error: insertError } = await supabaseAdmin
        .from('deals')
        .insert({
          ...dealData,
          partner_id: partnerId,
          zoho_deal_id: zohoDealId,
          created_by: createdBy
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating deal:', insertError);
        return res.status(500).json({
          error: 'Failed to create deal',
          details: insertError.message
        });
      }

      // Create initial stage history entry (only one record)
      await supabaseAdmin.from('deal_stage_history').insert({
        deal_id: newDeal.id,
        new_stage: localStage,
        notes: convertedLeadId ? 'Deal created from lead conversion via Zoho webhook' : 'Deal created via Zoho webhook'
      });

      // Log activity
      await supabaseAdmin.from('activity_log').insert({
        partner_id: partnerId,
        user_id: createdBy,
        entity_type: 'deal',
        entity_id: newDeal.id,
        action: 'deal_created',
        description: convertedLeadId 
          ? `Deal ${Deal_Name} created from lead conversion via Zoho webhook`
          : `Deal ${Deal_Name} created via Zoho webhook`,
        metadata: {
          zoho_deal_id: zohoDealId,
          stage: localStage,
          converted_from_lead_id: convertedLeadId
        }
      });

      console.log('Deal created successfully:', newDeal.id);

      return res.status(201).json({
        success: true,
        message: convertedLeadId 
          ? 'Deal created successfully from lead conversion'
          : 'Deal created successfully',
        data: {
          deal_id: newDeal.id,
          zoho_deal_id: zohoDealId,
          partner_id: partnerId,
          created_by: createdBy,
          stage: localStage,
          converted_from_lead_id: convertedLeadId
        }
      });
    }
  } catch (error) {
    console.error('Deal webhook error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;