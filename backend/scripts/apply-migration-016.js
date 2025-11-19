/**
 * Apply Migration 016: Add state column to leads table
 * 
 * This migration adds the state field required by the simplified lead form
 * 
 * Usage: node backend/scripts/apply-migration-016.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Starting Migration 016: Add state column to leads table\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/016_add_state_to_leads.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Migration SQL:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log();

    // Execute the migration
    console.log('⏳ Applying migration...');
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log();

    // Verify the column was added
    console.log('🔍 Verifying column addition...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('leads')
      .select('state')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      process.exit(1);
    }

    console.log('✅ Column verified successfully!');
    console.log();

    console.log('🎉 Migration 016 completed successfully!');
    console.log('📊 Summary:');
    console.log('   - Added "state" column to leads table');
    console.log('   - Added index on state column');
    console.log('   - Ready for simplified lead form submissions');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

applyMigration();

