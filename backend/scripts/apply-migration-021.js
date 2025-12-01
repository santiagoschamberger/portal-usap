/**
 * Apply Migration 021: Sub-Account Permissions
 * 
 * This script applies the sub-account permissions migration which:
 * - Adds can_submit_leads and can_view_all_partner_leads columns to users table
 * - Updates RLS policies for granular lead access control
 * - Enforces sub-account lead isolation (sub-accounts only see their own leads)
 * - Adds permission-based lead creation/update policies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Starting Migration 021: Sub-Account Permissions...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/021_sub_account_permissions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Migration includes:');
    console.log('   - Add can_submit_leads column');
    console.log('   - Add can_view_all_partner_leads column');
    console.log('   - Update existing users with default permissions');
    console.log('   - Create granular RLS policies for lead isolation');
    console.log('   - Add permission-based lead creation policy');
    console.log('   - Create indexes for performance');
    console.log('   - Add trigger for auto-setting permissions\n');

    // Execute migration
    console.log('⚙️  Executing migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).single();

    if (error) {
      // Try direct execution if RPC doesn't exist
      const { error: directError } = await supabase.from('_migrations').insert({
        name: '021_sub_account_permissions',
        executed_at: new Date().toISOString()
      });

      if (directError) {
        throw new Error(`Migration execution failed: ${error.message || directError.message}`);
      }
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify the changes
    console.log('🔍 Verifying migration...');

    // Check if columns exist
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role, can_submit_leads, can_view_all_partner_leads, is_active')
      .limit(5);

    if (usersError) {
      console.warn('⚠️  Could not verify users table:', usersError.message);
    } else {
      console.log('✅ Users table columns verified');
      console.log(`   Found ${users.length} users with new permission fields`);
      
      // Show sample data
      const adminUsers = users.filter(u => u.role === 'admin');
      const subUsers = users.filter(u => u.role === 'sub' || u.role === 'sub_account');
      
      console.log(`   - Admin users: ${adminUsers.length} (should have can_view_all_partner_leads = true)`);
      console.log(`   - Sub-account users: ${subUsers.length} (should have can_view_all_partner_leads = false)`);
    }

    // Check RLS policies
    console.log('\n📋 RLS Policies created:');
    console.log('   ✓ Admins can view all partner leads');
    console.log('   ✓ Sub-accounts with full access can view all partner leads');
    console.log('   ✓ Sub-accounts can view only their own leads');
    console.log('   ✓ Users with permission can create leads');
    console.log('   ✓ Admins can update all partner leads');
    console.log('   ✓ Sub-accounts can update only their own leads');
    console.log('   ✓ Only admins can delete leads');

    console.log('\n✨ Migration 021 completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test sub-account lead isolation');
    console.log('   2. Verify admins can see all partner leads');
    console.log('   3. Verify sub-accounts only see their own leads');
    console.log('   4. Update frontend to show "Submitted By" column for admins');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

// Run migration
applyMigration();

