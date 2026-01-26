import { Router } from 'express';
import axios from 'axios';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireRegularPartner, isAgentOrISO } from '../middleware/permissions';
import { zohoService } from '../services/zohoService';
import { supabaseAdmin } from '../config/database';
import { LeadStatusMappingService } from '../services/leadStatusMappingService';

const router = Router();

/**
 * GET /api/leads
 * Get leads for the authenticated partner with pagination, search, and filtering
 * 
 * Query Params:
 * - page: number (default 1)
 * - limit: number (default 10)
 * - search: string (search in name, company, email)
 * - status: string (filter by status)
 * - date_range: string ('today', 'week', 'month', 'quarter', 'year')
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const dateRange = req.query.date_range as string;

    const offset = (page - 1) * limit;

    // Start building the query
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
      `, { count: 'exact' })
      .eq('partner_id', req.user.partner_id)
      .neq('status', 'Converted'); // Exclude converted leads (should be deleted but filter as safety)

    // Sub-account permission check
    // If user is a sub-account, only show their own leads
    if (req.user.role === 'sub_account' || req.user.role === 'sub') {
      query = query.eq('created_by', req.user.id);
    }

    // Apply Search Filter
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},company.ilike.${searchTerm},email.ilike.${searchTerm}`);
    }

    // Apply Status Filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply Date Range Filter
    if (dateRange) {
      const now = new Date();
      let startDate = new Date();

      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      if (dateRange !== 'all') {
        query = query.gte('created_at', startDate.toISOString());
      }
    }

    // Apply Pagination and Sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: leads, count, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }

    return res.json({
      success: true,
      data: leads || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
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
 * GET /api/leads/assigned
 * Get leads assigned to the current agent/ISO
 * Only accessible by agents and ISOs
 */
router.get('/assigned', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is an agent/ISO
    const isAgent = await isAgentOrISO(req.user.id);
    if (!isAgent) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'This endpoint is only for agents and ISOs'
      });
    }

    // Use the database helper function to get assigned leads
    const { data: leads, error } = await supabaseAdmin
      .rpc('get_agent_assigned_leads', { user_uuid: req.user.id });

    if (error) {
      console.error('Error fetching assigned leads:', error);
      return res.status(500).json({
        error: 'Failed to fetch assigned leads',
        message: error.message
      });
    }

    return res.json({
      success: true,
      data: leads || [],
      total: leads?.length || 0
    });
  } catch (error) {
    console.error('Error fetching assigned leads:', error);
    return res.status(500).json({
      error: 'Failed to fetch assigned leads',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/leads
 * Create a new lead and sync to Zoho CRM
 * Only regular partners can create leads (not agents/ISOs)
 */
router.post('/', authenticateToken, requireRegularPartner, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Simplified lead form fields
    const {
      corporation_name,
      business_name,
      first_name,
      last_name,
      email,
      phone,
      notes,
      // Legacy fields (for backwards compatibility)
      company,
      full_name,
      state,
      lander_message,
      business_type,
      description
    } = req.body;

    // Validate required fields (support both new and legacy formats)
    const hasNewFormat = corporation_name && business_name && first_name && last_name && email;
    const hasLegacyFormat = company && (full_name || (first_name && last_name)) && email;
    
    if (!hasNewFormat && !hasLegacyFormat) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['corporation_name', 'business_name', 'first_name', 'last_name', 'email']
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

    // Handle both new and legacy formats
    let firstName = first_name;
    let lastName = last_name;
    let companyName = business_name || company;
    
    // Split full_name if provided (legacy format)
    if (full_name && !first_name && !last_name) {
      const nameParts = full_name.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];
    }

    // Prepare lead data for Zoho CRM
    const leadData = {
      Last_Name: lastName,
      First_Name: firstName,
      Email: email,
      Company: companyName,
      Phone: phone || '',
      State: state || '',
      Lander_Message: notes || lander_message || description || '',
      Entity_Type: Array.isArray(business_type) ? business_type : [business_type || 'Other'],
      StrategicPartnerId: req.user.id,
      Lead_Status: 'New',
      Lead_Source: 'Strategic Partner',
      Vendor: {
        name: partner.name,
        id: partner.zoho_partner_id,
      },
    };

    // Save lead to local database FIRST (following proper architecture pattern)
    const { data: localLead, error: localError} = await supabaseAdmin
      .from('leads')
      .insert({
        partner_id: req.user.partner_id,
        created_by: req.user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        company: companyName || null,
        state: state || null,
        status: 'New', // New leads start with "New" status
        lead_source: 'portal',
        notes: notes || lander_message || description || null,
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

      // Add note if additional info provided (lander_message or legacy description)
      const noteContent = lander_message || description;
      if (noteContent && zohoLeadId) {
        const noteData = {
          Note_Title: 'Additional Information',
          Note_Content: noteContent,
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
      description: `Lead created: ${firstName} ${lastName} (${email}) - ${company}`,
      metadata: { 
        zoho_lead_id: zohoLeadId,
        zoho_sync_status: zohoSyncStatus,
        state: state || null
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

        // Map Zoho lead status to our local status using LeadStatusMappingService
        const localStatus = LeadStatusMappingService.mapFromZoho(zohoLead.Lead_Status);

        // Check if lead already exists in our database (multiple ways to prevent duplicates)
        let existingLead = null;
        
        // First, try to find by zoho_lead_id (most reliable)
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
        
        // If not found by zoho_lead_id, try to find by email + partner combination
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
          // Debug: Log the status mapping
          console.log(`📊 Updating Lead ${zohoLead.id} (${email}):`, {
            zoho_status: zohoLead.Lead_Status,
            mapped_status: localStatus,
            current_db_status: existingLead.status,
            will_update: existingLead.status !== localStatus
          });
          
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
      corporation_name,
      business_name,
      first_name, 
      last_name, 
      email, 
      phone,
      notes,
      source,
      // Legacy fields for backwards compatibility
      company,
      business_type,
      industry,
      website
    } = req.body;

    // Support both new and legacy field formats
    const companyName = business_name || company;
    
    // Validate required fields
    if (!partner_id || !first_name || !last_name || !email || !phone || !companyName) {
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
      Company: companyName,
      Phone: phone,
      StrategicPartnerId: partner_id,
      Entity_Type: Array.isArray(business_type) ? business_type : [business_type || 'Other'],
      Lead_Status: 'New',
      Lead_Source: source || 'Public Form',
      Lander_Message: notes || '',
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
        company: companyName,
        status: 'New',
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


/**
 * GET /api/leads/debug/zoho-fields
 * DEBUG ONLY: Inspect Zoho field names to fix sync
 */
router.get('/debug/zoho-fields', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // 1. Get Token
    const token = await zohoService.getAccessToken();
    
    // 2. Fetch one lead
    const response = await axios.get('https://www.zohoapis.com/crm/v2/Leads', {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
      params: { per_page: 1 }
    });

    if (!response.data.data || response.data.data.length === 0) {
      return res.json({ message: 'No leads found in Zoho to inspect' });
    }

    const lead = response.data.data[0];
    
    // 3. Filter for partner-related fields
    const allKeys = Object.keys(lead);
    const partnerFields = allKeys.filter(key => 
      key.toLowerCase().includes('partner') || 
      key.toLowerCase().includes('vendor') ||
      key.toLowerCase().includes('account')
    );

    // 4. Test search with found values
    const searchTests: any[] = [];
    
    // Helper to test search
    const testSearch = async (criteria: string) => {
      try {
        const res = await axios.get('https://www.zohoapis.com/crm/v2/Leads/search', {
          headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
          params: { criteria }
        });
        searchTests.push({ criteria, success: true, count: res.data.data?.length || 0 });
      } catch (err: any) {
        searchTests.push({ criteria, success: false, error: err.response?.data || err.message });
      }
    };

    // Use the ID from the lead we found to test search
    let testId = '';
    if (lead.Vendor && lead.Vendor.id) testId = lead.Vendor.id;
    else if (lead.StrategicPartnerId) testId = lead.StrategicPartnerId; // Caution: might be UUID

    if (testId) {
       await testSearch(`(Vendor:equals:${testId})`);
       await testSearch(`(Vendor.id:equals:${testId})`);
       await testSearch(`(Partner:equals:${testId})`);
       await testSearch(`(Partner.id:equals:${testId})`);
       // Add other potential fields found
       for (const field of partnerFields) {
          if (lead[field] && typeof lead[field] === 'object' && lead[field].id) {
             await testSearch(`(${field}.id:equals:${lead[field].id})`);
          }
       }
    }

    return res.json({
      lead_sample: {
        id: lead.id,
        Vendor: lead.Vendor,
        Vendor_Name: lead.Vendor_Name,
        Partner: lead.Partner,
        StrategicPartnerId: lead.StrategicPartnerId,
        // Return all potential keys
        partner_related_keys: partnerFields
      },
      search_tests: searchTests
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message, details: error.response?.data });
  }
});

export default router;
