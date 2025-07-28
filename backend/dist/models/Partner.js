"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerModel = void 0;
const database_1 = require("../config/database");
class PartnerModel {
    static async getAll() {
        const { data, error } = await database_1.supabaseAdmin
            .from('partners')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to fetch partners: ${error.message}`);
        }
        return data || [];
    }
    static async getById(id) {
        const { data, error } = await database_1.supabaseAdmin
            .from('partners')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch partner: ${error.message}`);
        }
        return data;
    }
    static async getByEmail(email) {
        const { data, error } = await database_1.supabaseAdmin
            .from('partners')
            .select('*')
            .eq('email', email)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch partner: ${error.message}`);
        }
        return data;
    }
    static async getByZohoId(zohoId) {
        const { data, error } = await database_1.supabaseAdmin
            .from('partners')
            .select('*')
            .eq('zoho_partner_id', zohoId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch partner: ${error.message}`);
        }
        return data;
    }
    static async create(partnerData) {
        const { data, error } = await database_1.supabaseAdmin
            .from('partners')
            .insert(partnerData)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create partner: ${error.message}`);
        }
        return data;
    }
    static async update(id, updates) {
        const { data, error } = await database_1.supabaseAdmin
            .from('partners')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update partner: ${error.message}`);
        }
        return data;
    }
    static async delete(id) {
        const { error } = await database_1.supabaseAdmin
            .from('partners')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete partner: ${error.message}`);
        }
    }
    static async approve(id) {
        return this.update(id, {
            approved: true,
            status: 'approved'
        });
    }
    static async getApproved() {
        const { data, error } = await database_1.supabaseAdmin
            .from('partners')
            .select('*')
            .eq('approved', true)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to fetch approved partners: ${error.message}`);
        }
        return data || [];
    }
    static async getPending() {
        const { data, error } = await database_1.supabaseAdmin
            .from('partners')
            .select('*')
            .eq('approved', false)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to fetch pending partners: ${error.message}`);
        }
        return data || [];
    }
}
exports.PartnerModel = PartnerModel;
//# sourceMappingURL=Partner.js.map