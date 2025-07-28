import { Router } from 'express';
import { supabase } from '../config/database';
import { zohoService } from '../services/zohoService';

const router = Router();

/**
 * POST /api/webhooks/zoho/partner
 * Webhook for partner approval in Zoho CRM
 * Creates portal user when partner is approved
 */
router.post('/zoho/partner', async (req, res) => {
  try {
    const { id, VendorName, Email, PartnerType } = req.body;

    console.log('Partner webhook received:', { id, VendorName, Email, PartnerType });

    // Check if partner already exists
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('id')
      .eq('zoho_partner_id', id)
      .single();

    if (existingPartner) {
      return res.status(200).json({
        success: true,
        message: 'Partner already exists',
        partner_id: existingPartner.id
      });
    }

    // Create partner record
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .insert({
        zoho_partner_id: id,
        name: VendorName,
        email: Email,
        approved: true,
        status: 'active',
        zoho_sync_status: 'synced'
      })
      .select()
      .single();

    if (partnerError) {
      console.error('Error creating partner:', partnerError);
      return res.status(500).json({
        error: 'Failed to create partner',
        details: partnerError.message
      });
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: Email,
      email_confirm: true,
      user_metadata: {
        full_name: VendorName,
        partner_id: partner.id,
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      // Clean up partner record if auth user creation fails
      await supabase.from('partners').delete().eq('id', partner.id);
      return res.status(500).json({
        error: 'Failed to create user account',
        details: authError.message
      });
    }

    // Create user record in our users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        partner_id: partner.id,
        role: 'admin',
        first_name: VendorName.split(' ')[0] || VendorName,
        last_name: VendorName.split(' ').slice(1).join(' ') || '',
        is_active: true
      });

    if (userError) {
      console.error('Error creating user record:', userError);
      // Clean up auth user and partner if user record creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('partners').delete().eq('id', partner.id);
      return res.status(500).json({
        error: 'Failed to create user record',
        details: userError.message
      });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      partner_id: partner.id,
      user_id: authUser.user.id,
      activity_type: 'partner_created',
      description: `Partner ${VendorName} created via Zoho webhook`,
      metadata: { zoho_partner_id: id }
    });

    // TODO: Send welcome email with login instructions
    // This would typically involve sending a password reset link
    
    return res.status(201).json({
      success: true,
      message: 'Partner and user created successfully',
      data: {
        partner_id: partner.id,
        user_id: authUser.user.id,
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
 */
router.post('/zoho/contact', async (req, res) => {
  try {
    const { contactId, name, email, partnerId } = req.body;

    console.log('Contact webhook received:', { contactId, name, email, partnerId });

    // Find parent partner
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('zoho_partner_id', partnerId)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({
        error: 'Parent partner not found',
        partner_id: partnerId
      });
    }

    // Check if contact already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('partner_id', partner.id)
      .ilike('first_name', name.split(' ')[0] || name)
      .single();

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: 'Contact already exists',
        user_id: existingUser.id
      });
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        partner_id: partner.id,
        role: 'sub'
      }
    });

    if (authError) {
      console.error('Error creating auth user for contact:', authError);
      return res.status(500).json({
        error: 'Failed to create user account',
        details: authError.message
      });
    }

    // Create user record in our users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        partner_id: partner.id,
        role: 'sub',
        first_name: name.split(' ')[0] || name,
        last_name: name.split(' ').slice(1).join(' ') || '',
        is_active: true
      });

    if (userError) {
      console.error('Error creating contact user record:', userError);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({
        error: 'Failed to create user record',
        details: userError.message
      });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      partner_id: partner.id,
      user_id: authUser.user.id,
      activity_type: 'sub_account_created',
      description: `Sub-account created for ${name} via Zoho webhook`,
      metadata: { zoho_contact_id: contactId }
    });

    // TODO: Send welcome email to sub-account user

    return res.status(201).json({
      success: true,
      message: 'Contact user created successfully',
      data: {
        user_id: authUser.user.id,
        partner_id: partner.id,
        email: email
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