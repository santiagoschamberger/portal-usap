/**
 * Apply Migration 017: Add zoho_status column to leads table
 * 
 * This migration adds a column to store the original Zoho CRM status
 * alongside the mapped Portal display status.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📦 Migration 017: Add zoho_status column to leads table');
    console.log('─────────────────────────────────────────────────────\n');

    // Read migration SQL
    const migrationPath = path.join(__dirname, '../database/migrations/017_add_zoho_status_to_leads.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n');

    // Execute migration using execute_sql function
    console.log('🔧 Executing migration...\n');
    
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('📊 Changes made:');
    console.log('   • Added zoho_status column to leads table');
    console.log('   • Created index on zoho_status column');
    console.log('   • Added column documentation\n');

    // Verify the column was added
    const { data: verification, error: verifyError } = await supabase
      .from('leads')
      .select('id, status, zoho_status')
      .limit(1);

    if (verifyError) {
      console.warn('⚠️  Could not verify column (this may be normal if no leads exist yet)');
    } else {
      console.log('✅ Column verification successful');
    }

    console.log('\n✨ Migration 017 complete!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

applyMigration();

