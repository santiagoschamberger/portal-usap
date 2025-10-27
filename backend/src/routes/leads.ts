import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { zohoService } from '../services/zohoService';
import { supabase, supabaseAdmin } from '../config/database';

const router = Router();

/**
 * GET /api/leads
 * Get leads for the authenticated partner
 * Sub-accounts only see their own leads, main accounts see all
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get leads from Zoho CRM for this partner
    const zohoResponse = await zohoService.getPartnerLeads(req.user.id);
    
    const leads = zohoResponse.data || [];

    // Build query for local database
    let query = supabaseAdmin
      .from('leads')
      .select(`
        *,
        creator:created_by (
          id,
          email,
          first_name,
          last_name,
          role
        )
      `)
      .eq('partner_id', req.user.partner_id);

    // If user is a sub-account, only show their own leads
    if (req.user.role === 'sub_account') {
      query = query.eq('created_by', req.user.id);
    }

    const { data: localLeads, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching local leads:', error);
    }

    return res.json({
      success: true,
      data: {
        zoho_leads: leads,
        local_leads: localLeads || [],
        total: leads.length,
        is_sub_account: req.user.role === 'sub_account'
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

    // Get partner information using admin client to bypass RLS
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('zoho_partner_id, name')
      .eq('id', req.user.partner_id)
      .single();

    if (partnerError || !partner) {
      console.error('Partner fetch error:', partnerError);
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

    // Save lead to local database FIRST (following proper architecture pattern)
    const { data: localLead, error: localError } = await supabaseAdmin
      .from('leads')
      .insert({
        partner_id: req.user.partner_id,
        created_by: req.user.id,
        first_name,
        last_name,
        email,
        phone: phone || null,
        company: company || null,
        status: 'new',
        lead_source: 'portal',
        notes: description || null,
        zoho_sync_status: 'pending' // Initially pending until Zoho sync succeeds
      })
      .select()
      .single();

    if (localError) {
      console.error('❌ CRITICAL: Failed to save lead to local database:', {
        error: localError,
        code: localError.code,
        message: localError.message,
        details: localError.details,
        hint: localError.hint,
        leadData: { first_name, last_name, email, partner_id: req.user.partner_id }
      });
      
      return res.status(500).json({
        error: 'Failed to save lead to database',
        message: localError.message,
        details: process.env.NODE_ENV === 'development' ? localError : undefined
      });
    }

    console.log('✅ Lead saved to local database:', localLead.id);

    // Now sync to Zoho CRM
    let zohoLeadId: string | null = null;
    let zohoSyncStatus: 'synced' | 'error' = 'synced';
    
    try {
      const zohoResponse = await zohoService.createLead(leadData);
      
      if (!zohoResponse.data || zohoResponse.data[0].code !== 'SUCCESS') {
        throw new Error(zohoResponse.data?.[0]?.message || 'Unknown Zoho error');
      }

      zohoLeadId = zohoResponse.data[0].details.id;
      console.log('✅ Lead synced to Zoho CRM:', zohoLeadId);

      // Add note if description provided
      if (description && zohoLeadId) {
        const noteData = {
          Note_Title: 'Lead Description',
          Note_Content: description,
          Parent_Id: zohoLeadId,
          se_module: 'Leads',
        };

        try {
          await zohoService.addNoteToLead(noteData);
          console.log('✅ Note added to Zoho lead');
        } catch (noteError) {
          console.error('⚠️ Failed to add note to lead:', noteError);
          // Continue even if note fails
        }
      }

      // Update local record with Zoho lead ID
      const { error: updateError } = await supabaseAdmin
        .from('leads')
        .update({
          zoho_lead_id: zohoLeadId,
          zoho_sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', localLead.id);

      if (updateError) {
        console.error('⚠️ Failed to update lead with Zoho ID:', updateError);
        // Non-critical error, continue
      }

    } catch (zohoError) {
      console.error('❌ Failed to sync lead to Zoho CRM:', zohoError);
      zohoSyncStatus = 'error';
      
      // Update local record to mark sync error
      await supabaseAdmin
        .from('leads')
        .update({
          zoho_sync_status: 'error',
          notes: `${description || ''}\n\nZoho Sync Error: ${zohoError instanceof Error ? zohoError.message : 'Unknown error'}`
        })
        .eq('id', localLead.id);
      
      // Don't fail the request - lead is saved locally
      console.log('⚠️ Lead saved locally but Zoho sync failed. Will retry later.');
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      partner_id: req.user.partner_id,
      user_id: req.user.id,
      lead_id: localLead.id,
      entity_type: 'lead',
      entity_id: localLead.id,
      action: 'created',
      description: `Lead created: ${first_name} ${last_name} (${email})`,
      metadata: { 
        zoho_lead_id: zohoLeadId,
        zoho_sync_status: zohoSyncStatus
      }
    });

    return res.status(201).json({
      success: true,
      message: zohoSyncStatus === 'synced' 
        ? 'Lead created and synced successfully' 
        : 'Lead created successfully (Zoho sync pending)',
      data: {
        lead_id: localLead.id,
        zoho_lead_id: zohoLeadId,
        local_lead: {
          ...localLead,
          zoho_lead_id: zohoLeadId,
          zoho_sync_status: zohoSyncStatus
        },
        sync_status: zohoSyncStatus
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

    const { data: lead, error } = await supabaseAdmin
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

    // Get current lead using admin client to bypass RLS
    const { data: currentLead, error: fetchError } = await supabaseAdmin
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

    // Update lead status using admin client to bypass RLS
    const { data: updatedLead, error: updateError } = await supabaseAdmin
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
    await supabaseAdmin.from('lead_status_history').insert({
      lead_id: req.params.id,
      old_status: currentLead.status,
      new_status: status,
      changed_by_user_id: req.user.id,
      notes
    });

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
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

/**
 * POST /api/leads/sync
 * Sync historical leads from Zoho CRM for this partner
 */
router.post('/sync', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get partner information to find their Zoho vendor ID
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, name, zoho_partner_id')
      .eq('id', req.user.partner_id)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({
        error: 'Partner not found',
        message: 'Unable to find partner information'
      });
    }

    if (!partner.zoho_partner_id) {
      return res.status(400).json({
        error: 'Partner not linked to Zoho',
        message: 'This partner is not associated with a Zoho Vendor record'
      });
    }

    // Fetch leads from Zoho CRM by vendor ID
    const zohoResponse = await zohoService.getLeadsByVendor(partner.zoho_partner_id);

    if (!zohoResponse.data || zohoResponse.data.length === 0) {
      return res.json({
        success: true,
        message: 'No leads found in Zoho CRM for this partner',
        synced: 0,
        created: 0,
        updated: 0
      });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const syncResults = [];

    // Process each lead from Zoho
    for (const zohoLead of zohoResponse.data) {
      try {
        const email = zohoLead.Email?.toLowerCase();
        if (!email || !zohoLead.First_Name || !zohoLead.Last_Name) {
          skipped++;
          syncResults.push({
            zoho_lead_id: zohoLead.id,
            status: 'skipped',
            reason: 'Missing required fields'
          });
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

        // Check if lead already exists in our database
        const { data: existingLead } = await supabaseAdmin
          .from('leads')
          .select('id, status, zoho_lead_id')
          .eq('zoho_lead_id', zohoLead.id)
          .single();

        if (existingLead) {
          // Update existing lead
          const { error: updateError } = await supabaseAdmin
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

          if (updateError) {
            syncResults.push({
              zoho_lead_id: zohoLead.id,
              email,
              status: 'error',
              reason: updateError.message
            });
          } else {
            updated++;
            syncResults.push({
              zoho_lead_id: zohoLead.id,
              email,
              status: 'updated',
              lead_id: existingLead.id
            });
          }
        } else {
          // Create new lead
          const { data: newLead, error: insertError } = await supabaseAdmin
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
              created_by: req.user.id
            })
            .select()
            .single();

          if (insertError) {
            syncResults.push({
              zoho_lead_id: zohoLead.id,
              email,
              status: 'error',
              reason: insertError.message
            });
          } else {
            created++;
            syncResults.push({
              zoho_lead_id: zohoLead.id,
              email,
              status: 'created',
              lead_id: newLead.id
            });

            // Create initial status history entry
            await supabaseAdmin.from('lead_status_history').insert({
              lead_id: newLead.id,
              new_status: localStatus,
              notes: 'Lead synced from Zoho CRM',
              changed_by_user_id: req.user.id
            });
          }
        }
      } catch (error) {
        console.error(`Error processing lead ${zohoLead.id}:`, error);
        syncResults.push({
          zoho_lead_id: zohoLead.id,
          email: zohoLead.Email,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update partner's last sync timestamp
    await supabaseAdmin
      .from('partners')
      .update({
        last_sync_at: new Date().toISOString(),
        zoho_sync_status: 'synced'
      })
      .eq('id', partner.id);

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      partner_id: req.user.partner_id,
      user_id: req.user.id,
      entity_type: 'lead',
      entity_id: partner.id,
      action: 'leads_synced',
      description: `Synced ${zohoResponse.data.length} leads from Zoho CRM (${created} created, ${updated} updated, ${skipped} skipped)`,
      metadata: { created, updated, skipped, total: zohoResponse.data.length }
    });

    return res.json({
      success: true,
      message: 'Leads synced successfully',
      data: {
        total: zohoResponse.data.length,
        created,
        updated,
        skipped,
        details: syncResults
      }
    });
  } catch (error) {
    console.error('Error syncing leads:', error);
    return res.status(500).json({
      error: 'Failed to sync leads',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/leads/public
 * Create a lead from public form (no authentication required)
 */
router.post('/public', async (req, res) => {
  try {
    const { 
      partner_id, 
      first_name, 
      last_name, 
      email, 
      phone, 
      company, 
      business_type,
      industry,
      website,
      notes,
      source 
    } = req.body;

    // Validate required fields
    if (!partner_id || !first_name || !last_name || !email || !phone || !company) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Please fill in all required fields' 
      });
    }

    // Verify partner exists
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('users')
      .select('id, partner_id')
      .eq('id', partner_id)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({ 
        error: 'Invalid partner',
        message: 'The partner link is invalid or expired' 
      });
    }

    // Get partner name and Zoho partner ID
    const { data: partnerData } = await supabaseAdmin
      .from('partners')
      .select('name, zoho_partner_id')
      .eq('id', partner.partner_id)
      .single();

    const partnerName = partnerData?.name || 'Unknown Partner';
    const zohoPartnerId = partnerData?.zoho_partner_id;

    if (!zohoPartnerId) {
      return res.status(400).json({
        error: 'Partner not linked to Zoho',
        message: 'This partner is not properly configured in Zoho CRM'
      });
    }

    // Create lead in Zoho CRM
    const zohoLead = await zohoService.createLead({
      Email: email,
      First_Name: first_name,
      Last_Name: last_name,
      Company: company,
      Phone: phone,
      StrategicPartnerId: partner_id,
      Entity_Type: Array.isArray(business_type) ? business_type : [business_type],
      Lead_Status: 'New',
      Lead_Source: source || 'Public Form',
      Vendor: {
        name: partnerName,
        id: zohoPartnerId
      }
    });

    // Also save to local database
    const { data: localLead, error: localError } = await supabaseAdmin
      .from('leads')
      .insert({
        partner_id: partner.partner_id,
        zoho_lead_id: zohoLead.id,
        first_name,
        last_name,
        email,
        phone,
        company,
        status: 'new',
        lead_source: source || 'Public Form',
        created_by: partner_id,
        notes: notes || null
      })
      .select()
      .single();

    if (localError) {
      console.error('Error saving lead locally:', localError);
      // Don't fail the request if Zoho succeeded
    }

    return res.json({
      success: true,
      message: 'Lead submitted successfully',
      data: {
        zoho_id: zohoLead.id,
        local_id: localLead?.id
      }
    });
  } catch (error) {
    console.error('Error creating public lead:', error);
    return res.status(500).json({
      error: 'Failed to submit lead',
      message: error instanceof Error ? error.message : 'Please try again later'
    });
  }
});

export default router;