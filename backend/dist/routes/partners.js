"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const zohoService_1 = require("../services/zohoService");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { data: partner, error: partnerError } = await database_1.supabaseAdmin
            .from('partners')
            .select('*')
            .eq('id', req.user.partner_id)
            .single();
        if (partnerError || !partner) {
            return res.status(404).json({
                error: 'Partner not found',
                message: 'Unable to find partner information'
            });
        }
        return res.json({
            success: true,
            data: partner
        });
    }
    catch (error) {
        console.error('Error fetching partner profile:', error);
        return res.status(500).json({
            error: 'Failed to fetch profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/profile', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { name, email, phone, address } = req.body;
        const { data: partner, error } = await database_1.supabaseAdmin
            .from('partners')
            .update({
            name,
            email,
            phone,
            address,
            updated_at: new Date().toISOString()
        })
            .eq('id', req.user.partner_id)
            .select()
            .single();
        if (error) {
            return res.status(500).json({
                error: 'Failed to update profile',
                details: error.message
            });
        }
        return res.json({
            success: true,
            message: 'Profile updated successfully',
            data: partner
        });
    }
    catch (error) {
        console.error('Error updating partner profile:', error);
        return res.status(500).json({
            error: 'Failed to update profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/sub-accounts', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { data: subAccounts, error } = await database_1.supabaseAdmin
            .from('users')
            .select('id, email, first_name, last_name, role, is_active, created_at, updated_at')
            .eq('partner_id', req.user.partner_id)
            .neq('id', req.user.id)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching sub-accounts:', error);
            return res.status(500).json({
                error: 'Failed to fetch sub-accounts',
                details: error.message
            });
        }
        const subAccountsWithStats = await Promise.all((subAccounts || []).map(async (subAccount) => {
            const { data: leads } = await database_1.supabaseAdmin
                .from('leads')
                .select('id, status')
                .eq('created_by_user_id', subAccount.id);
            const stats = {
                total_leads: leads?.length || 0,
                new_leads: leads?.filter(l => l.status === 'new').length || 0,
                contacted: leads?.filter(l => l.status === 'contacted').length || 0,
                qualified: leads?.filter(l => l.status === 'qualified').length || 0,
                proposal: leads?.filter(l => l.status === 'proposal').length || 0,
                closed_won: leads?.filter(l => l.status === 'closed_won').length || 0,
                closed_lost: leads?.filter(l => l.status === 'closed_lost').length || 0
            };
            return {
                ...subAccount,
                lead_stats: stats
            };
        }));
        return res.json({
            success: true,
            data: subAccountsWithStats,
            total: subAccountsWithStats.length
        });
    }
    catch (error) {
        console.error('Error fetching sub-accounts:', error);
        return res.status(500).json({
            error: 'Failed to fetch sub-accounts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/sub-accounts', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { email, first_name, last_name } = req.body;
        if (!email || !first_name || !last_name) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['email', 'first_name', 'last_name']
            });
        }
        const { data: existingUser } = await database_1.supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        if (existingUser) {
            return res.status(400).json({
                error: 'Email already exists',
                message: 'A user with this email already exists'
            });
        }
        const tempPassword = crypto_1.default.randomBytes(16).toString('hex');
        const { data: authData, error: authError } = await database_1.supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                first_name,
                last_name,
                partner_id: req.user.partner_id,
                role: 'sub_account'
            }
        });
        if (authError || !authData.user) {
            console.error('Auth user creation error:', authError);
            return res.status(500).json({
                error: 'Failed to create sub-account',
                details: authError?.message || 'Unknown error'
            });
        }
        const { data: userData, error: userError } = await database_1.supabaseAdmin
            .from('users')
            .insert({
            id: authData.user.id,
            email,
            first_name,
            last_name,
            partner_id: req.user.partner_id,
            role: 'sub_account',
            is_active: true
        })
            .select()
            .single();
        if (userError) {
            await database_1.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            console.error('User data creation error:', userError);
            return res.status(500).json({
                error: 'Failed to create sub-account',
                details: userError.message
            });
        }
        await database_1.supabaseAdmin.from('activity_log').insert({
            partner_id: req.user.partner_id,
            user_id: req.user.id,
            activity_type: 'sub_account_created',
            description: `Sub-account created for ${first_name} ${last_name} (${email})`,
            metadata: { sub_account_id: userData.id }
        });
        const { error: resetError } = await database_1.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
        });
        if (resetError) {
            console.error('Failed to send password reset email:', resetError);
        }
        return res.status(201).json({
            success: true,
            message: 'Sub-account created successfully. Password reset email sent.',
            data: userData
        });
    }
    catch (error) {
        console.error('Error creating sub-account:', error);
        return res.status(500).json({
            error: 'Failed to create sub-account',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/sub-accounts/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { data: subAccount, error } = await database_1.supabaseAdmin
            .from('users')
            .select('id, email, first_name, last_name, role, is_active, created_at, updated_at')
            .eq('id', req.params.id)
            .eq('partner_id', req.user.partner_id)
            .single();
        if (error || !subAccount) {
            return res.status(404).json({
                error: 'Sub-account not found',
                message: 'Sub-account does not exist or you do not have access to it'
            });
        }
        const { data: leads } = await database_1.supabaseAdmin
            .from('leads')
            .select('id, status')
            .eq('created_by_user_id', req.params.id);
        const stats = {
            total_leads: leads?.length || 0,
            new_leads: leads?.filter(l => l.status === 'new').length || 0,
            active_leads: leads?.filter(l => ['new', 'contacted', 'qualified'].includes(l.status)).length || 0,
            converted_leads: leads?.filter(l => l.status === 'converted').length || 0
        };
        return res.json({
            success: true,
            data: {
                ...subAccount,
                stats
            }
        });
    }
    catch (error) {
        console.error('Error fetching sub-account:', error);
        return res.status(500).json({
            error: 'Failed to fetch sub-account',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/sub-accounts/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { first_name, last_name, is_active } = req.body;
        const { data: existingUser } = await database_1.supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', req.params.id)
            .eq('partner_id', req.user.partner_id)
            .single();
        if (!existingUser) {
            return res.status(404).json({
                error: 'Sub-account not found',
                message: 'Sub-account does not exist or you do not have access to it'
            });
        }
        const { data: updatedUser, error } = await database_1.supabaseAdmin
            .from('users')
            .update({
            first_name,
            last_name,
            is_active,
            updated_at: new Date().toISOString()
        })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) {
            return res.status(500).json({
                error: 'Failed to update sub-account',
                details: error.message
            });
        }
        await database_1.supabaseAdmin.from('activity_log').insert({
            partner_id: req.user.partner_id,
            user_id: req.user.id,
            activity_type: 'sub_account_updated',
            description: `Sub-account updated: ${first_name} ${last_name}`,
            metadata: { sub_account_id: req.params.id }
        });
        return res.json({
            success: true,
            message: 'Sub-account updated successfully',
            data: updatedUser
        });
    }
    catch (error) {
        console.error('Error updating sub-account:', error);
        return res.status(500).json({
            error: 'Failed to update sub-account',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/sync-contacts', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
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
        const zohoResponse = await zohoService_1.zohoService.getContactsByVendor(partner.zoho_partner_id);
        if (!zohoResponse.data || zohoResponse.data.length === 0) {
            return res.json({
                success: true,
                message: 'No contacts found in Zoho CRM for this partner',
                synced: 0,
                created: 0,
                updated: 0
            });
        }
        let created = 0;
        let updated = 0;
        const syncResults = [];
        for (const contact of zohoResponse.data) {
            try {
                const email = contact.Email?.toLowerCase();
                if (!email || !contact.First_Name || !contact.Last_Name) {
                    syncResults.push({
                        contact_id: contact.id,
                        status: 'skipped',
                        reason: 'Missing required fields'
                    });
                    continue;
                }
                const { data: existingUser } = await database_1.supabaseAdmin
                    .from('users')
                    .select('id, email, first_name, last_name')
                    .eq('email', email)
                    .single();
                if (existingUser) {
                    const { error: updateError } = await database_1.supabaseAdmin
                        .from('users')
                        .update({
                        first_name: contact.First_Name,
                        last_name: contact.Last_Name,
                        updated_at: new Date().toISOString()
                    })
                        .eq('id', existingUser.id);
                    if (updateError) {
                        syncResults.push({
                            contact_id: contact.id,
                            email,
                            status: 'error',
                            reason: updateError.message
                        });
                    }
                    else {
                        updated++;
                        syncResults.push({
                            contact_id: contact.id,
                            email,
                            status: 'updated',
                            user_id: existingUser.id
                        });
                    }
                }
                else {
                    const tempPassword = crypto_1.default.randomBytes(16).toString('hex');
                    const { data: authData, error: authError } = await database_1.supabaseAdmin.auth.admin.createUser({
                        email,
                        password: tempPassword,
                        email_confirm: true,
                        user_metadata: {
                            first_name: contact.First_Name,
                            last_name: contact.Last_Name,
                            partner_id: partner.id,
                            role: 'sub_account',
                            zoho_contact_id: contact.id
                        }
                    });
                    if (authError || !authData.user) {
                        syncResults.push({
                            contact_id: contact.id,
                            email,
                            status: 'error',
                            reason: authError?.message || 'Failed to create auth user'
                        });
                        continue;
                    }
                    const { error: userError } = await database_1.supabaseAdmin
                        .from('users')
                        .insert({
                        id: authData.user.id,
                        email,
                        first_name: contact.First_Name,
                        last_name: contact.Last_Name,
                        partner_id: partner.id,
                        role: 'sub_account',
                        is_active: true
                    });
                    if (userError) {
                        await database_1.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                        syncResults.push({
                            contact_id: contact.id,
                            email,
                            status: 'error',
                            reason: userError.message
                        });
                    }
                    else {
                        created++;
                        syncResults.push({
                            contact_id: contact.id,
                            email,
                            status: 'created',
                            user_id: authData.user.id
                        });
                        await database_1.supabase.auth.resetPasswordForEmail(email, {
                            redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
                        });
                    }
                }
            }
            catch (error) {
                console.error(`Error processing contact ${contact.id}:`, error);
                syncResults.push({
                    contact_id: contact.id,
                    email: contact.Email,
                    status: 'error',
                    reason: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        await database_1.supabaseAdmin.from('activity_log').insert({
            partner_id: req.user.partner_id,
            user_id: req.user.id,
            activity_type: 'contacts_synced',
            description: `Synced ${zohoResponse.data.length} contacts from Zoho CRM (${created} created, ${updated} updated)`,
            metadata: { created, updated, total: zohoResponse.data.length }
        });
        return res.json({
            success: true,
            message: 'Contacts synced successfully',
            synced: zohoResponse.data.length,
            created,
            updated,
            details: syncResults
        });
    }
    catch (error) {
        console.error('Error syncing contacts:', error);
        return res.status(500).json({
            error: 'Failed to sync contacts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/sub-accounts/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { data: existingUser } = await database_1.supabaseAdmin
            .from('users')
            .select('id, email, first_name, last_name')
            .eq('id', req.params.id)
            .eq('partner_id', req.user.partner_id)
            .single();
        if (!existingUser) {
            return res.status(404).json({
                error: 'Sub-account not found',
                message: 'Sub-account does not exist or you do not have access to it'
            });
        }
        const { error } = await database_1.supabaseAdmin
            .from('users')
            .update({
            is_active: false,
            updated_at: new Date().toISOString()
        })
            .eq('id', req.params.id);
        if (error) {
            return res.status(500).json({
                error: 'Failed to deactivate sub-account',
                details: error.message
            });
        }
        await database_1.supabaseAdmin.from('activity_log').insert({
            partner_id: req.user.partner_id,
            user_id: req.user.id,
            activity_type: 'sub_account_deactivated',
            description: `Sub-account deactivated: ${existingUser.first_name} ${existingUser.last_name}`,
            metadata: { sub_account_id: req.params.id }
        });
        return res.json({
            success: true,
            message: 'Sub-account deactivated successfully'
        });
    }
    catch (error) {
        console.error('Error deactivating sub-account:', error);
        return res.status(500).json({
            error: 'Failed to deactivate sub-account',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=partners.js.map