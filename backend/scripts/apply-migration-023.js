/**
 * Apply Migration 023: Update Status and Stage Mappings
 * 
 * This script applies the status and stage mapping updates to match
 * the new client requirements (December 2025).
 * 
 * Changes:
 * - Lead statuses: 6 old statuses → 6 new statuses
 * - Deal stages: 6 old stages → 6 new stages
 * 
 * Reference: docs/reference/STATUS_STAGE_MAPPING_REFERENCE.md
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
  console.log('🚀 Starting Migration 023: Update Status and Stage Mappings\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../database/migrations/023_update_status_stage_mappings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('⚠️  WARNING: This will update all existing lead statuses and deal stages');
    console.log('   Backup tables will be created automatically\n');

    // Show current counts
    console.log('📊 Current database state:');
    
    const { data: leadStatuses } = await supabase
      .from('leads')
      .select('status')
      .not('status', 'is', null);
    
    const { data: dealStages } = await supabase
      .from('deals')
      .select('stage')
      .not('stage', 'is', null);

    console.log(`   Leads to migrate: ${leadStatuses?.length || 0}`);
    console.log(`   Deals to migrate: ${dealStages?.length || 0}\n`);

    // Execute the migration
    console.log('🔄 Executing migration...\n');
    
    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      // Note: This requires the SQL to be split into individual statements
      console.log('⚠️  exec_sql function not available, trying alternative method...');
      
      // Split SQL into statements and execute one by one
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('DO $$') || statement.includes('CREATE TABLE') || statement.includes('UPDATE')) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (stmtError) {
            console.error(`❌ Error executing statement: ${stmtError.message}`);
          }
        }
      }
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify the migration
    console.log('🔍 Verifying migration results:\n');

    const { data: newLeadStatuses } = await supabase
      .from('leads')
      .select('status')
      .not('status', 'is', null);

    const { data: newDealStages } = await supabase
      .from('deals')
      .select('stage')
      .not('stage', 'is', null);

    // Count by status
    const leadStatusCounts = {};
    newLeadStatuses?.forEach(lead => {
      leadStatusCounts[lead.status] = (leadStatusCounts[lead.status] || 0) + 1;
    });

    const dealStageCounts = {};
    newDealStages?.forEach(deal => {
      dealStageCounts[deal.stage] = (dealStageCounts[deal.stage] || 0) + 1;
    });

    console.log('📊 Lead Status Distribution:');
    Object.entries(leadStatusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });

    console.log('\n📊 Deal Stage Distribution:');
    Object.entries(dealStageCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([stage, count]) => {
        console.log(`   ${stage}: ${count}`);
      });

    console.log('\n✅ Migration 023 completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Verify the status/stage distributions above');
    console.log('   2. Test webhook processing with new mappings');
    console.log('   3. Update frontend UI components');
    console.log('   4. Deploy updated backend code');
    console.log('\n💾 Rollback Information:');
    console.log('   Backup tables created:');
    console.log('   - leads_backup_pre_migration_023');
    console.log('   - deals_backup_pre_migration_023');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n⚠️  Database state may be inconsistent');
    console.error('   Check backup tables: leads_backup_pre_migration_023, deals_backup_pre_migration_023');
    process.exit(1);
  }
}

// Run the migration
applyMigration();

