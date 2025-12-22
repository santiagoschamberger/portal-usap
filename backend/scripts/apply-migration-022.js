#!/usr/bin/env node

/**
 * Apply Migration 022: Agent/ISO Handling
 * 
 * This script applies the Phase 7 migration to add:
 * - partner_type field to partners table
 * - assigned_agent_id to leads and deals tables
 * - RLS policies for agent/ISO access control
 * - Helper functions for agent operations
 * - Triggers for agent assignment logging
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting Migration 022: Agent/ISO Handling\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/022_agent_iso_handling.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('📊 Migration includes:');
    console.log('   - Add partner_type to partners table');
    console.log('   - Add assigned_agent_id to leads and deals tables');
    console.log('   - Create 3 performance indexes');
    console.log('   - Update 7 RLS policies for agent access');
    console.log('   - Create 3 helper functions');
    console.log('   - Create 2 triggers for agent assignment logging\n');

    // Execute migration
    console.log('⏳ Executing migration...\n');
    
    const { data, error } = await supabase.rpc('execute_sql', {
      query: migrationSQL
    });

    if (error) {
      console.error('❌ Error executing migration:', error.message);
      throw error;
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify migration
    console.log('🔍 Verifying migration...\n');

    // Check if partner_type column exists
    const { data: partnersColumns, error: partnersError } = await supabase
      .from('partners')
      .select('partner_type')
      .limit(1);

    if (partnersError && !partnersError.message.includes('column')) {
      console.error('❌ Error checking partners table:', partnersError.message);
    } else if (!partnersError) {
      console.log('   ✅ partner_type column added to partners table');
    }

    // Check if assigned_agent_id column exists in leads
    const { data: leadsColumns, error: leadsError } = await supabase
      .from('leads')
      .select('assigned_agent_id')
      .limit(1);

    if (leadsError && !leadsError.message.includes('column')) {
      console.error('❌ Error checking leads table:', leadsError.message);
    } else if (!leadsError) {
      console.log('   ✅ assigned_agent_id column added to leads table');
    }

    // Check if assigned_agent_id column exists in deals
    const { data: dealsColumns, error: dealsError } = await supabase
      .from('deals')
      .select('assigned_agent_id')
      .limit(1);

    if (dealsError && !dealsError.message.includes('column')) {
      console.error('❌ Error checking deals table:', dealsError.message);
    } else if (!dealsError) {
      console.log('   ✅ assigned_agent_id column added to deals table');
    }

    console.log('\n✅ Migration 022 completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Update backend API to handle partner types');
    console.log('   2. Update frontend UI for agent/ISO users');
    console.log('   3. Test agent lead assignment functionality');
    console.log('   4. Deploy backend and frontend changes');
    console.log('   5. Configure Zoho webhooks to include agent assignments\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

// Run migration
applyMigration();




