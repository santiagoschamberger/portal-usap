"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
router.post('/zoho/partner', async (req, res) => {
    try {
        const { id, VendorName, Email } = req.body;
        console.log('Partner webhook received:', { id, VendorName, Email });
        const { data, error } = await database_1.supabase.rpc('create_partner_with_user', {
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
        await database_1.supabase.from('activity_log').insert({
            partner_id: data[0].partner_id,
            user_id: data[0].user_id,
            activity_type: 'partner_created',
            description: `Partner ${VendorName} created via Zoho webhook`,
            metadata: { zoho_partner_id: id }
        });
        return res.status(201).json({
            success: true,
            message: 'Partner and user created successfully',
            data: {
                partner_id: data[0].partner_id,
                user_id: data[0].user_id,
                email: Email
            }
        });
    }
    catch (error) {
        console.error('Partner webhook error:', error);
        return res.status(500).json({
            error: 'Webhook processing failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/zoho/lead-status', async (req, res) => {
    try {
        const { id: zohoLeadId, Lead_Status, StrategicPartnerId } = req.body;
        console.log('Lead status webhook received:', { zohoLeadId, Lead_Status, StrategicPartnerId });
        const { data: lead, error: leadError } = await database_1.supabase
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
        if (oldStatus !== newStatus) {
            const { error: updateError } = await database_1.supabase
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
            await database_1.supabase.from('lead_status_history').insert({
                lead_id: lead.id,
                old_status: oldStatus,
                new_status: newStatus,
                changed_by: 'zoho_webhook',
                notes: 'Status updated via Zoho CRM webhook'
            });
            await database_1.supabase.from('activity_log').insert({
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
    }
    catch (error) {
        console.error('Lead status webhook error:', error);
        return res.status(500).json({
            error: 'Webhook processing failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/zoho/contact', async (req, res) => {
    try {
        const fullname = req.body.fullname || `${req.body.First_Name || ''} ${req.body.Last_Name || ''}`.trim();
        const email = req.body.email || req.body.Email;
        const parentid = req.body.parentid || req.body.Vendor?.id || req.body.Account_Name?.id;
        const contactId = req.body.partnerid || req.body.id;
        let firstName, lastName;
        if (req.body.First_Name && req.body.Last_Name) {
            firstName = req.body.First_Name;
            lastName = req.body.Last_Name;
        }
        else {
            const nameParts = fullname.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
        }
        console.log('Contact webhook received:', {
            format: req.body.fullname ? 'module-parameters' : 'json-body',
            contactId,
            fullname,
            firstName,
            lastName,
            email,
            parentid,
            requestBody: req.body
        });
        if (!email || (!fullname && !firstName)) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['email', 'fullname or First_Name/Last_Name'],
                received: req.body
            });
        }
        if (!parentid) {
            console.log('No parent partner ID - skipping sub-account creation');
            return res.status(200).json({
                success: false,
                message: 'No parent partner linked - sub-account not created',
                reason: 'Contact must be linked to a Partner in Zoho CRM (parentid, Vendor.id, or Account_Name.id)',
                received: req.body
            });
        }
        const { data: partner, error: partnerError } = await database_1.supabaseAdmin
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
        if (!partner.approved) {
            console.log('Parent partner not approved:', partner.id);
            return res.status(200).json({
                success: false,
                message: 'Parent partner not approved',
                reason: 'Partner must be approved before sub-accounts can be created',
                partner_id: partner.id
            });
        }
        const { data: existingUser } = await database_1.supabaseAdmin
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
        const tempPassword = crypto_1.default.randomBytes(16).toString('hex');
        const { data: authUser, error: authError } = await database_1.supabaseAdmin.auth.admin.createUser({
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
        const { error: userError } = await database_1.supabaseAdmin
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
            await database_1.supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            return res.status(500).json({
                error: 'Failed to create user record',
                details: userError.message
            });
        }
        await database_1.supabaseAdmin.from('activity_log').insert({
            partner_id: partner.id,
            user_id: authUser.user.id,
            activity_type: 'sub_account_created',
            description: `Sub-account created for ${firstName} ${lastName} via Zoho webhook`,
            metadata: {
                zoho_contact_id: contactId,
                zoho_partner_id: parentid
            }
        });
        const { error: resetError } = await database_1.supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
            redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
        });
        if (resetError) {
            console.error('Failed to send password reset email:', resetError);
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
    }
    catch (error) {
        console.error('Contact webhook error:', error);
        return res.status(500).json({
            error: 'Webhook processing failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map