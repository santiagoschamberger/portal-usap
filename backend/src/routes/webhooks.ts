import { Router } from 'express';
import { supabase, supabaseAdmin } from '../config/database';
import { zohoService } from '../services/zohoService';
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

    // Find the lead in our database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, partner_id, status')
      .eq('zoho_lead_id', zohoLeadId)
      .single();

    if (leadError || !lead) {
      console.log('Lead not found in local database:', zohoLeadId);
      return res.status(404).json({
        error: 'Lead not found',
        zoho_lead_id: zohoLeadId
      });
    }

    const oldStatus = lead.status;
    const newStatus = Lead_Status?.toLowerCase() || 'unknown';

    // Update lead status if it has changed
    if (oldStatus !== newStatus) {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: newStatus,
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

      // Add status history record
      await supabase.from('lead_status_history').insert({
        lead_id: lead.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: 'zoho_webhook',
        notes: 'Status updated via Zoho CRM webhook'
      });

      // Log activity
      await supabase.from('activity_log').insert({
        partner_id: lead.partner_id,
        lead_id: lead.id,
        activity_type: 'lead_status_updated',
        description: `Lead status changed from ${oldStatus} to ${newStatus} via Zoho CRM`,
        metadata: { 
          source: 'zoho_webhook',
          zoho_lead_id: zohoLeadId,
          old_status: oldStatus,
          new_status: newStatus
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
        new_status: newStatus
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

    // Check if parent partner ID is provided
    // IMPORTANT: Only create sub-accounts for contacts that are EXPLICITLY linked to a partner
    // Do NOT create sub-accounts for contacts that are auto-generated from leads
    if (!parentid) {
      console.log('✅ No parent partner ID - skipping sub-account creation (this is normal for lead-generated contacts)');
      return res.status(200).json({
        success: false,
        message: 'No parent partner linked - sub-account not created',
        reason: 'Contact must be linked to a Partner in Zoho CRM (parentid, Vendor.id, or Account_Name.id)',
        note: 'This is expected behavior for contacts generated from leads',
        received: req.body
      });
    }

    console.log(`✅ Parent partner ID found: ${parentid} - proceeding with sub-account creation`);

    // Find parent partner in portal using admin client to bypass RLS
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, name, approved')
      .eq('zoho_partner_id', parentid)
      .single();

    if (partnerError || !partner) {
      console.log('Parent partner not found in portal:', parentid);
      return res.status(200).json({
        success: false,
        message: 'Parent partner not found in portal',
        reason: 'Partner must be approved and exist in portal before creating sub-accounts',
        zoho_partner_id: parentid
      });
    }

    // Verify parent partner is approved
    if (!partner.approved) {
      console.log('Parent partner not approved:', partner.id);
      return res.status(200).json({
        success: false,
        message: 'Parent partner not approved',
        reason: 'Partner must be approved before sub-accounts can be created',
        partner_id: partner.id
      });
    }

    // Check if user with this email already exists (including main accounts)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, role, partner_id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      console.log('User with this email already exists:', { 
        id: existingUser.id, 
        role: existingUser.role,
        partner_id: existingUser.partner_id
      });
      
      // If this is the MAIN account of the partner, don't create a duplicate sub-account
      // This happens when a partner submits a lead and Zoho auto-creates a contact
      if (existingUser.partner_id === partner.id) {
        console.log('⚠️ This email belongs to the main partner account - skipping sub-account creation');
        return res.status(200).json({
          success: false,
          message: 'User already exists as main account',
          reason: 'Cannot create sub-account for email that belongs to the main partner account',
          user_id: existingUser.id
        });
      }
      
      // User exists but for a different partner
      console.log('✅ Sub-account already exists:', existingUser.id);
      return res.status(200).json({
        success: true,
        message: 'Sub-account already exists',
        user_id: existingUser.id
      });
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(16).toString('hex');

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        partner_id: partner.id,
        role: 'sub_account',
        zoho_contact_id: contactId
      }
    });

    if (authError || !authUser.user) {
      console.error('Error creating auth user for contact:', authError);
      return res.status(500).json({
        error: 'Failed to create user account',
        details: authError?.message || 'Unknown error'
      });
    }

    // Create user record in portal users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: email.toLowerCase(),
        partner_id: partner.id,
        role: 'sub_account',
        first_name: firstName,
        last_name: lastName,
        password_hash: 'placeholder', // Placeholder since auth is handled by Supabase Auth
        is_active: true
      });

    if (userError) {
      console.error('Error creating contact user record:', userError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({
        error: 'Failed to create user record',
        details: userError.message
      });
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      partner_id: partner.id,
      user_id: authUser.user.id,
      activity_type: 'sub_account_created',
      description: `Sub-account created for ${firstName} ${lastName} via Zoho webhook`,
      metadata: { 
        zoho_contact_id: contactId,
        zoho_partner_id: parentid
      }
    });

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
    });

    if (resetError) {
      console.error('Failed to send password reset email:', resetError);
      // Continue anyway - user created successfully
    }

    console.log('Sub-account created successfully:', authUser.user.id);

    return res.status(201).json({
      success: true,
      message: 'Sub-account created successfully. Password reset email sent.',
      data: {
        user_id: authUser.user.id,
        partner_id: partner.id,
        email: email.toLowerCase(),
        zoho_contact_id: contactId
      }
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
    const {
      id: zohoDealId,
      Deal_Name,
      Stage,
      Lead_Source,
      Business_Name,
      Contact_First_Name,
      Contact_Name,
      Partners_Id, // From ${Lookup:Partner.Partners Id} - this is our partner identifier
      StrategicPartnerId // This should identify the original lead submitter
    } = req.body;

    console.log('Deal webhook received:', {
      zohoDealId,
      Deal_Name,
      Stage,
      Partners_Id,
      StrategicPartnerId
    });

    // Find the partner using Partners_Id
    let partnerId: string | null = null;
    let createdBy: string | null = null;

    if (Partners_Id) {
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('id')
        .eq('zoho_partner_id', Partners_Id)
        .single();

      if (partner) {
        partnerId = partner.id;
        
        // First, try to find the original submitter using StrategicPartnerId
        if (StrategicPartnerId) {
          const { data: originalSubmitter } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('zoho_user_id', StrategicPartnerId)
            .eq('partner_id', partner.id)
            .single();
            
          if (originalSubmitter) {
            createdBy = originalSubmitter.id;
            console.log('Found original submitter via StrategicPartnerId:', originalSubmitter.id);
          }
        }
        
        // If no StrategicPartnerId or submitter not found, try to find by matching lead details
        if (!createdBy) {
          // Try to find the original lead that matches this deal
          const { data: matchingLead } = await supabaseAdmin
            .from('leads')
            .select('created_by')
            .eq('partner_id', partner.id)
            .or(`first_name.eq.${Contact_First_Name || ''},company.eq.${Business_Name || Deal_Name}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (matchingLead && matchingLead.created_by) {
            createdBy = matchingLead.created_by;
            console.log('Found original submitter via lead matching:', matchingLead.created_by);
          }
        }
        
        // If still no submitter found, fall back to main partner user
        if (!createdBy) {
          const { data: mainUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('partner_id', partner.id)
            .eq('role', 'admin') // Main partner account
            .single();
            
          if (mainUser) {
            createdBy = mainUser.id;
            console.log('Falling back to main partner user:', mainUser.id);
          }
        }
      }
    }

    // If still no partner found, can't proceed
    if (!partnerId) {
      console.log('No partner found for deal:', { Partners_Id });
      return res.status(400).json({
        error: 'Partner not found',
        message: 'Could not link deal to a partner in the portal'
      });
    }

    // Map Zoho deal stage to our local stage
    const stageMap: { [key: string]: string } = {
      'Qualification': 'Qualification',
      'Needs Analysis': 'Needs Analysis',
      'Value Proposition': 'Value Proposition',
      'Proposal/Price Quote': 'Proposal',
      'Proposal': 'Proposal',
      'Negotiation/Review': 'Negotiation',
      'Negotiation': 'Negotiation',
      'Closed Won': 'Closed Won',
      'Closed Lost': 'Closed Lost',
      'Closed Lost to Competition': 'Closed Lost'
    };

    const localStage = stageMap[Stage] || 'Qualification';

    // Extract contact info
    const accountName = Business_Name || Deal_Name || 'Unknown';
    const contactName = Contact_Name || '';
    const firstName = Contact_First_Name || contactName.split(' ')[0] || null;
    const lastName = contactName.split(' ').slice(1).join(' ') || null;
    const email = null; // We'll need to add email field if available
    const phone = null; // We'll need to add phone field if available

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

      // Add stage history if stage changed
      if (existingDeal.stage !== localStage) {
        await supabaseAdmin.from('deal_stage_history').insert({
          deal_id: existingDeal.id,
          old_stage: existingDeal.stage,
          new_stage: localStage,
          notes: 'Stage updated via Zoho webhook'
        });
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

      // Create initial stage history entry
      await supabaseAdmin.from('deal_stage_history').insert({
        deal_id: newDeal.id,
        new_stage: localStage,
        notes: 'Deal created via Zoho webhook'
      });

      // Log activity
      await supabaseAdmin.from('activity_log').insert({
        partner_id: partnerId,
        user_id: createdBy,
        entity_type: 'deal',
        entity_id: newDeal.id,
        action: 'deal_created',
        description: `Deal ${Deal_Name} created via Zoho webhook`,
        metadata: {
          zoho_deal_id: zohoDealId,
          stage: localStage
        }
      });

      console.log('Deal created successfully:', newDeal.id);

      return res.status(201).json({
        success: true,
        message: 'Deal created successfully',
        data: {
          deal_id: newDeal.id,
          zoho_deal_id: zohoDealId,
          partner_id: partnerId,
          created_by: createdBy,
          stage: localStage
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