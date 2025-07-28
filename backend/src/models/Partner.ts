import { supabase, supabaseAdmin, Partner } from '../config/database';

export class PartnerModel {
    /**
     * Get all partners (admin only)
     */
    static async getAll(): Promise<Partner[]> {
        const { data, error } = await supabaseAdmin
            .from('partners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch partners: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Get partner by ID
     */
    static async getById(id: string): Promise<Partner | null> {
        const { data, error } = await supabaseAdmin
            .from('partners')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            throw new Error(`Failed to fetch partner: ${error.message}`);
        }

        return data;
    }

    /**
     * Get partner by email
     */
    static async getByEmail(email: string): Promise<Partner | null> {
        const { data, error } = await supabaseAdmin
            .from('partners')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            throw new Error(`Failed to fetch partner: ${error.message}`);
        }

        return data;
    }

    /**
     * Get partner by Zoho ID
     */
    static async getByZohoId(zohoId: string): Promise<Partner | null> {
        const { data, error } = await supabaseAdmin
            .from('partners')
            .select('*')
            .eq('zoho_partner_id', zohoId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            throw new Error(`Failed to fetch partner: ${error.message}`);
        }

        return data;
    }

    /**
     * Create a new partner
     */
    static async create(partnerData: Omit<Partner, 'id' | 'created_at' | 'updated_at'>): Promise<Partner> {
        const { data, error } = await supabaseAdmin
            .from('partners')
            .insert(partnerData)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create partner: ${error.message}`);
        }

        return data;
    }

    /**
     * Update partner
     */
    static async update(id: string, updates: Partial<Partner>): Promise<Partner> {
        const { data, error } = await supabaseAdmin
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

    /**
     * Delete partner
     */
    static async delete(id: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('partners')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete partner: ${error.message}`);
        }
    }

    /**
     * Approve partner (sets approved = true and status = 'approved')
     */
    static async approve(id: string): Promise<Partner> {
        return this.update(id, {
            approved: true,
            status: 'approved'
        });
    }

    /**
     * Get approved partners only
     */
    static async getApproved(): Promise<Partner[]> {
        const { data, error } = await supabaseAdmin
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

    /**
     * Get pending approval partners
     */
    static async getPending(): Promise<Partner[]> {
        const { data, error } = await supabaseAdmin
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