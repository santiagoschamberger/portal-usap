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
        const { data: partner, error: partnerError } = await database_1.supabaseAdmin
            .from('partners')
            .select('zoho_partner_id')
            .eq('id', req.user.partner_id)
            .single();
        if (partnerError || !partner) {
            return res.status(400).json({
                error: 'Partner not found',
                message: 'Unable to find partner information'
            });
        }
        let zohoDeals = [];
        if (partner.zoho_partner_id) {
            try {
                const zohoResponse = await zohoService_1.zohoService.getDealsByVendor(partner.zoho_partner_id);
                zohoDeals = zohoResponse.data || [];
            }
            catch (zohoError) {
                console.error('Error fetching deals from Zoho:', zohoError);
            }
        }
        let query = database_1.supabaseAdmin
            .from('deals')
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
        if (req.user.role === 'sub_account') {
            query = query.eq('created_by', req.user.id);
        }
        const { data: localDeals, error } = await query.order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching local deals:', error);
        }
        return res.json({
            success: true,
            data: {
                zoho_deals: zohoDeals,
                local_deals: localDeals || [],
                total: zohoDeals.length + (localDeals?.length || 0),
                is_sub_account: req.user.role === 'sub_account'
            }
        });
    }
    catch (error) {
        console.error('Error fetching deals:', error);
        return res.status(500).json({
            error: 'Failed to fetch deals',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { data: deal, error } = await database_1.supabaseAdmin
            .from('deals')
            .select(`
        *,
        deal_stage_history (
          old_stage,
          new_stage,
          created_at,
          notes
        )
      `)
            .eq('id', req.params.id)
            .eq('partner_id', req.user.partner_id)
            .single();
        if (error || !deal) {
            return res.status(404).json({
                error: 'Deal not found',
                message: 'Deal does not exist or you do not have access to it'
            });
        }
        return res.json({
            success: true,
            data: deal
        });
    }
    catch (error) {
        console.error('Error fetching deal:', error);
        return res.status(500).json({
            error: 'Failed to fetch deal',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/sync', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { data: partner, error: partnerError } = await database_1.supabaseAdmin
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
        const zohoResponse = await zohoService_1.zohoService.getDealsByVendor(partner.zoho_partner_id);
        if (!zohoResponse.data || zohoResponse.data.length === 0) {
            return res.json({
                success: true,
                message: 'No deals found in Zoho CRM for this partner',
                data: {
                    created: 0,
                    updated: 0,
                    skipped: 0
                }
            });
        }
        let created = 0;
        let updated = 0;
        let skipped = 0;
        const syncResults = [];
        for (const zohoDeal of zohoResponse.data) {
            try {
                const stageMap = {
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
                const localStage = stageMap[zohoDeal.Stage] || 'Qualification';
                const accountName = zohoDeal.Account_Name?.name || zohoDeal.Deal_Name || 'Unknown';
                const contactName = zohoDeal.Contact_Name?.name || '';
                const nameParts = contactName.split(' ');
                const { data: existingDeal } = await database_1.supabaseAdmin
                    .from('deals')
                    .select('id, stage, zoho_deal_id')
                    .eq('zoho_deal_id', zohoDeal.id)
                    .single();
                const dealData = {
                    deal_name: zohoDeal.Deal_Name || accountName,
                    first_name: nameParts[0] || null,
                    last_name: nameParts.slice(1).join(' ') || null,
                    email: zohoDeal.Contact_Name?.Email || null,
                    phone: zohoDeal.Contact_Name?.Phone || null,
                    company: accountName,
                    amount: parseFloat(zohoDeal.Amount || '0'),
                    stage: localStage,
                    close_date: zohoDeal.Closing_Date || null,
                    probability: zohoDeal.Probability || 0,
                    lead_source: zohoDeal.Lead_Source || 'zoho_sync',
                    zoho_sync_status: 'synced',
                    last_sync_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                if (existingDeal) {
                    const { error: updateError } = await database_1.supabaseAdmin
                        .from('deals')
                        .update(dealData)
                        .eq('id', existingDeal.id);
                    if (updateError) {
                        syncResults.push({
                            zoho_deal_id: zohoDeal.id,
                            deal_name: zohoDeal.Deal_Name,
                            status: 'error',
                            reason: updateError.message
                        });
                    }
                    else {
                        updated++;
                        syncResults.push({
                            zoho_deal_id: zohoDeal.id,
                            deal_name: zohoDeal.Deal_Name,
                            status: 'updated',
                            deal_id: existingDeal.id
                        });
                        if (existingDeal.stage !== localStage) {
                            await database_1.supabaseAdmin.from('deal_stage_history').insert({
                                deal_id: existingDeal.id,
                                old_stage: existingDeal.stage,
                                new_stage: localStage,
                                notes: 'Stage updated via Zoho sync',
                                changed_by_user_id: req.user.id
                            });
                        }
                    }
                }
                else {
                    const { data: newDeal, error: insertError } = await database_1.supabaseAdmin
                        .from('deals')
                        .insert({
                        ...dealData,
                        partner_id: partner.id,
                        zoho_deal_id: zohoDeal.id,
                        created_by: req.user.id
                    })
                        .select()
                        .single();
                    if (insertError) {
                        syncResults.push({
                            zoho_deal_id: zohoDeal.id,
                            deal_name: zohoDeal.Deal_Name,
                            status: 'error',
                            reason: insertError.message
                        });
                    }
                    else {
                        created++;
                        syncResults.push({
                            zoho_deal_id: zohoDeal.id,
                            deal_name: zohoDeal.Deal_Name,
                            status: 'created',
                            deal_id: newDeal.id
                        });
                        await database_1.supabaseAdmin.from('deal_stage_history').insert({
                            deal_id: newDeal.id,
                            new_stage: localStage,
                            notes: 'Deal synced from Zoho CRM',
                            changed_by_user_id: req.user.id
                        });
                    }
                }
            }
            catch (error) {
                console.error(`Error processing deal ${zohoDeal.id}:`, error);
                skipped++;
                syncResults.push({
                    zoho_deal_id: zohoDeal.id,
                    deal_name: zohoDeal.Deal_Name,
                    status: 'error',
                    reason: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        await database_1.supabaseAdmin.from('activity_log').insert({
            partner_id: req.user.partner_id,
            user_id: req.user.id,
            entity_type: 'deal',
            entity_id: partner.id,
            action: 'deals_synced',
            description: `Synced ${zohoResponse.data.length} deals from Zoho CRM (${created} created, ${updated} updated, ${skipped} skipped)`,
            metadata: { created, updated, skipped, total: zohoResponse.data.length }
        });
        return res.json({
            success: true,
            message: 'Deals synced successfully',
            data: {
                total: zohoResponse.data.length,
                created,
                updated,
                skipped,
                details: syncResults
            }
        });
    }
    catch (error) {
        console.error('Error syncing deals:', error);
        return res.status(500).json({
            error: 'Failed to sync deals',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.patch('/:id/stage', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { stage, notes } = req.body;
        if (!stage) {
            return res.status(400).json({
                error: 'Stage is required'
            });
        }
        const { data: currentDeal, error: fetchError } = await database_1.supabaseAdmin
            .from('deals')
            .select('stage')
            .eq('id', req.params.id)
            .eq('partner_id', req.user.partner_id)
            .single();
        if (fetchError || !currentDeal) {
            return res.status(404).json({
                error: 'Deal not found'
            });
        }
        const { data: updatedDeal, error: updateError } = await database_1.supabaseAdmin
            .from('deals')
            .update({
            stage,
            updated_at: new Date().toISOString()
        })
            .eq('id', req.params.id)
            .eq('partner_id', req.user.partner_id)
            .select()
            .single();
        if (updateError) {
            return res.status(500).json({
                error: 'Failed to update deal stage',
                details: updateError.message
            });
        }
        await database_1.supabaseAdmin.from('deal_stage_history').insert({
            deal_id: req.params.id,
            old_stage: currentDeal.stage,
            new_stage: stage,
            changed_by_user_id: req.user.id,
            notes
        });
        await database_1.supabaseAdmin.from('activity_log').insert({
            partner_id: req.user.partner_id,
            user_id: req.user.id,
            entity_type: 'deal',
            entity_id: req.params.id,
            action: 'deal_stage_updated',
            description: `Deal stage changed from ${currentDeal.stage} to ${stage}`,
            metadata: { old_stage: currentDeal.stage, new_stage: stage }
        });
        return res.json({
            success: true,
            message: 'Deal stage updated successfully',
            data: updatedDeal
        });
    }
    catch (error) {
        console.error('Error updating deal stage:', error);
        return res.status(500).json({
            error: 'Failed to update deal stage',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=deals.js.map