import { createClient } from '@supabase/supabase-js';

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://cvzadrvtncnjanoehzhj.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_PUBLIC_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Database config loaded:', {
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey,
    serviceKey: !!supabaseServiceKey
});

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables:', {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_PUBLIC_KEY: !!process.env.SUPABASE_ANON_PUBLIC_KEY,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
    throw new Error('Missing required Supabase environment variables');
}

// Create Supabase client for public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client with service role for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Database connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('partners')
            .select('count', { count: 'exact', head: true });
        
        return !error;
    } catch (error) {
        console.error('Database connection check failed:', error);
        return false;
    }
};

// Types for our database tables
export interface Partner {
    id: string;
    zoho_partner_id?: string;
    name: string;
    email: string;
    phone?: string;
    company_name?: string;
    website?: string;
    address?: any;
    approved: boolean;
    status: 'pending' | 'approved' | 'suspended' | 'rejected';
    zoho_sync_status: 'pending' | 'synced' | 'error';
    last_sync_at?: string;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    partner_id?: string;
    email: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
    role: 'admin' | 'partner' | 'sub_account';
    is_active: boolean;
    email_verified: boolean;
    phone?: string;
    avatar_url?: string;
    last_login?: string;
    password_reset_token?: string;
    password_reset_expires?: string;
    email_verification_token?: string;
    created_at: string;
    updated_at: string;
}

export interface Lead {
    id: string;
    partner_id: string;
    zoho_lead_id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company?: string;
    job_title?: string;
    website?: string;
    industry?: string;
    lead_source?: string;
    status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'nurture' | 'unqualified';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    score: number;
    notes?: string;
    custom_fields?: any;
    address?: any;
    zoho_sync_status: 'pending' | 'synced' | 'error';
    last_sync_at?: string;
    created_by?: string;
    assigned_to?: string;
    created_at: string;
    updated_at: string;
}

export interface LeadStatusHistory {
    id: string;
    lead_id: string;
    old_status?: string;
    new_status: string;
    reason?: string;
    notes?: string;
    changed_by?: string;
    changed_at: string;
}

export interface ActivityLog {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    description?: string;
    metadata?: any;
    user_id?: string;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

export interface UserSession {
    id: string;
    user_id: string;
    refresh_token_hash: string;
    device_info?: any;
    ip_address?: string;
    is_active: boolean;
    expires_at: string;
    created_at: string;
    last_used_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: string;
    data?: any;
    read: boolean;
    read_at?: string;
    expires_at?: string;
    created_at: string;
} 