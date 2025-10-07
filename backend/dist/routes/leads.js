"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const zohoService_1 = require("../services/zohoService");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const zohoResponse = await zohoService_1.zohoService.getPartnerLeads(req.user.id);
        const leads = zohoResponse.data || [];
        const { data: localLeads, error } = await database_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Error fetching leads:', error);
        return res.status(500).json({
            error: 'Failed to fetch leads',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { first_name, last_name, email, phone, company, business_type, description } = req.body;
        if (!first_name || !last_name || !email) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['first_name', 'last_name', 'email']
            });
        }
        const { data: partner, error: partnerError } = await database_1.supabaseAdmin
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
        const { data: localLead, error: localError } = await database_1.supabaseAdmin
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
            zoho_sync_status: 'pending'
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
        let zohoLeadId = null;
        let zohoSyncStatus = 'synced';
        try {
            const zohoResponse = await zohoService_1.zohoService.createLead(leadData);
            if (!zohoResponse.data || zohoResponse.data[0].code !== 'SUCCESS') {
                throw new Error(zohoResponse.data?.[0]?.message || 'Unknown Zoho error');
            }
            zohoLeadId = zohoResponse.data[0].details.id;
            console.log('✅ Lead synced to Zoho CRM:', zohoLeadId);
            if (description && zohoLeadId) {
                const noteData = {
                    Note_Title: 'Lead Description',
                    Note_Content: description,
                    Parent_Id: zohoLeadId,
                    se_module: 'Leads',
                };
                try {
                    await zohoService_1.zohoService.addNoteToLead(noteData);
                    console.log('✅ Note added to Zoho lead');
                }
                catch (noteError) {
                    console.error('⚠️ Failed to add note to lead:', noteError);
                }
            }
            const { error: updateError } = await database_1.supabaseAdmin
                .from('leads')
                .update({
                zoho_lead_id: zohoLeadId,
                zoho_sync_status: 'synced',
                last_sync_at: new Date().toISOString()
            })
                .eq('id', localLead.id);
            if (updateError) {
                console.error('⚠️ Failed to update lead with Zoho ID:', updateError);
            }
        }
        catch (zohoError) {
            console.error('❌ Failed to sync lead to Zoho CRM:', zohoError);
            zohoSyncStatus = 'error';
            await database_1.supabaseAdmin
                .from('leads')
                .update({
                zoho_sync_status: 'error',
                notes: `${description || ''}\n\nZoho Sync Error: ${zohoError instanceof Error ? zohoError.message : 'Unknown error'}`
            })
                .eq('id', localLead.id);
            console.log('⚠️ Lead saved locally but Zoho sync failed. Will retry later.');
        }
        await database_1.supabaseAdmin.from('activity_log').insert({
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
    }
    catch (error) {
        console.error('Error creating lead:', error);
        return res.status(500).json({
            error: 'Failed to create lead',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { data: lead, error } = await database_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Error fetching lead:', error);
        return res.status(500).json({
            error: 'Failed to fetch lead',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.patch('/:id/status', auth_1.authenticateToken, async (req, res) => {
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
        const { data: currentLead, error: fetchError } = await database_1.supabaseAdmin
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
        const { data: updatedLead, error: updateError } = await database_1.supabaseAdmin
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
        await database_1.supabaseAdmin.from('lead_status_history').insert({
            lead_id: req.params.id,
            old_status: currentLead.status,
            new_status: status,
            changed_by_user_id: req.user.id,
            notes
        });
        await database_1.supabaseAdmin.from('activity_log').insert({
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
    }
    catch (error) {
        console.error('Error updating lead status:', error);
        return res.status(500).json({
            error: 'Failed to update lead status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=leads.js.map