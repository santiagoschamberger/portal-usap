import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { zohoService } from '../services/zohoService';
import { supabase } from '../config/database';

const router = Router();

/**
 * GET /api/leads
 * Get leads for the authenticated partner
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get leads from Zoho CRM for this partner
    const zohoResponse = await zohoService.getPartnerLeads(req.user.id);
    
    const leads = zohoResponse.data || [];

    // Also sync with local database
    const { data: localLeads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('partner_id', req.user.partner_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching local leads:', error);
    }

    return res.json({
      success: true,
      data: {
        zoho_leads: leads,
        local_leads: localLeads || [],
        total: leads.length
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({
      error: 'Failed to fetch leads',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/leads
 * Create a new lead and sync to Zoho CRM
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      first_name,
      last_name,
      email,
      phone,
      company,
      business_type,
      description
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['first_name', 'last_name', 'email']
      });
    }

    // Get partner information
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('zoho_partner_id, name')
      .eq('id', req.user.partner_id)
      .single();

    if (partnerError || !partner) {
      return res.status(400).json({
        error: 'Partner not found',
        message: 'Unable to find partner information'
      });
    }

    // Prepare lead data for Zoho
    const leadData = {
      Last_Name: last_name,
      First_Name: first_name,
      Email: email,
      Company: company || 'N/A',
      Phone: phone || '',
      StrategicPartnerId: req.user.id,
      Entity_Type: Array.isArray(business_type) ? business_type : [business_type || 'Business'],
      Lead_Status: 'New',
      Lead_Source: 'Strategic Partner',
      Vendor: {
        name: partner.name,
        id: partner.zoho_partner_id,
      },
    };

    // Create lead in Zoho CRM
    const zohoResponse = await zohoService.createLead(leadData);
    
    if (!zohoResponse.data || zohoResponse.data[0].code !== 'SUCCESS') {
      return res.status(400).json({
        error: 'Failed to create lead in Zoho CRM',
        details: zohoResponse.data?.[0]?.message || 'Unknown error'
      });
    }

    const zohoLeadId = zohoResponse.data[0].details.id;

    // Add note if description provided
    if (description) {
      const noteData = {
        Note_Title: 'Lead Description',
        Note_Content: description,
        Parent_Id: zohoLeadId,
        se_module: 'Leads',
      };

      try {
        await zohoService.addNoteToLead(noteData);
      } catch (noteError) {
        console.error('Failed to add note to lead:', noteError);
        // Continue even if note fails
      }
    }

    // Save lead to local database
    const { data: localLead, error: localError } = await supabase
      .from('leads')
      .insert({
        partner_id: req.user.partner_id,
        created_by_user_id: req.user.id,
        zoho_lead_id: zohoLeadId,
        first_name,
        last_name,
        email,
        phone,
        company,
        status: 'new',
        source: 'portal',
        notes: description,
        zoho_sync_status: 'synced'
      })
      .select()
      .single();

    if (localError) {
      console.error('Error saving lead locally:', localError);
      // Continue even if local save fails, as Zoho is primary
    }

    // Log activity
    await supabase.from('activity_log').insert({
      partner_id: req.user.partner_id,
      user_id: req.user.id,
      lead_id: localLead?.id,
      activity_type: 'lead_created',
      description: `Lead created: ${first_name} ${last_name} (${email})`,
      metadata: { zoho_lead_id: zohoLeadId }
    });

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: {
        zoho_lead_id: zohoLeadId,
        local_lead: localLead,
        zoho_response: zohoResponse.data[0]
      }
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({
      error: 'Failed to create lead',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/leads/:id
 * Get specific lead details
 */
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select(`
        *,
        lead_status_history (
          old_status,
          new_status,
          created_at,
          notes
        )
      `)
      .eq('id', req.params.id)
      .eq('partner_id', req.user.partner_id)
      .single();

    if (error || !lead) {
      return res.status(404).json({
        error: 'Lead not found',
        message: 'Lead does not exist or you do not have access to it'
      });
    }

    return res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return res.status(500).json({
      error: 'Failed to fetch lead',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/leads/:id/status
 * Update lead status (typically triggered by Zoho webhook)
 */
router.patch('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }

    // Get current lead
    const { data: currentLead, error: fetchError } = await supabase
      .from('leads')
      .select('status')
      .eq('id', req.params.id)
      .eq('partner_id', req.user.partner_id)
      .single();

    if (fetchError || !currentLead) {
      return res.status(404).json({
        error: 'Lead not found'
      });
    }

    // Update lead status
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('partner_id', req.user.partner_id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        error: 'Failed to update lead status',
        details: updateError.message
      });
    }

    // Add status history record
    await supabase.from('lead_status_history').insert({
      lead_id: req.params.id,
      old_status: currentLead.status,
      new_status: status,
      changed_by_user_id: req.user.id,
      notes
    });

    // Log activity
    await supabase.from('activity_log').insert({
      partner_id: req.user.partner_id,
      user_id: req.user.id,
      lead_id: req.params.id,
      activity_type: 'lead_status_updated',
      description: `Lead status changed from ${currentLead.status} to ${status}`,
      metadata: { old_status: currentLead.status, new_status: status }
    });

    return res.json({
      success: true,
      message: 'Lead status updated successfully',
      data: updatedLead
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    return res.status(500).json({
      error: 'Failed to update lead status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;