"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseConnection = exports.supabaseAdmin = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
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
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
const checkDatabaseConnection = async () => {
    try {
        const { data, error } = await exports.supabase
            .from('partners')
            .select('count', { count: 'exact', head: true });
        return !error;
    }
    catch (error) {
        console.error('Database connection check failed:', error);
        return false;
    }
};
exports.checkDatabaseConnection = checkDatabaseConnection;
//# sourceMappingURL=database.js.map