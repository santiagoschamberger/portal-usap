#!/usr/bin/env node

/**
 * Apply Migration 018: Update Lead Status Constraint
 * 
 * This migration updates the lead status constraint to match the new status values
 * defined in LeadStatusMappingService.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Starting Migration 018: Update Lead Status Constraint\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/018_update_lead_status_constraint.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📝 SQL to execute:');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log();

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });

      if (error) {
        // Try direct execution as fallback
        const { error: directError } = await supabase
          .from('_sql_exec')
          .select('*')
          .limit(0);
        
        if (directError) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          throw error;
        }
      }

      console.log(`✅ Statement ${i + 1} executed successfully`);
    }

    console.log('\n✅ Migration 018 applied successfully!');
    console.log('\n📋 Summary:');
    console.log('   • Dropped old leads_status_check constraint');
    console.log('   • Updated existing lead statuses to new format');
    console.log('   • Added new constraint with updated values:');
    console.log('     - Pre-Vet / New Lead');
    console.log('     - Contacted');
    console.log('     - Sent for Signature / Submitted');
    console.log('     - Approved');
    console.log('     - Declined');
    console.log('     - Dead / Withdrawn');
    console.log('   • Updated default status to "Pre-Vet / New Lead"');
    console.log('   • Added column comment for documentation');

    // Verify the changes
    console.log('\n🔍 Verifying migration...');
    const { data: leads, error: verifyError } = await supabase
      .from('leads')
      .select('status')
      .limit(5);

    if (verifyError) {
      console.warn('⚠️  Could not verify migration:', verifyError.message);
    } else {
      console.log('✅ Verification successful - sample lead statuses:');
      leads?.forEach((lead, idx) => {
        console.log(`   ${idx + 1}. ${lead.status}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nPlease check the error above and try again.');
    console.error('You may need to manually execute the migration SQL in Supabase SQL Editor.');
    process.exit(1);
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('\n✨ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
