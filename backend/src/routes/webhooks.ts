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
    if (!parentid) {
      console.log('No parent partner ID - skipping sub-account creation');
      return res.status(200).json({
        success: false,
        message: 'No parent partner linked - sub-account not created',
        reason: 'Contact must be linked to a Partner in Zoho CRM (parentid, Vendor.id, or Account_Name.id)',
        received: req.body
      });
    }

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

    // Check if sub-account with this email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      console.log('Sub-account already exists:', existingUser.id);
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

export default router;