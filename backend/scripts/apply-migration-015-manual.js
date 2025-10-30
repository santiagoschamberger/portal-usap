const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying migration 015: Update Deal Stages with Actual Zoho Stages...');
    
    // Step 1: Drop existing constraint
    console.log('   1. Dropping existing stage constraint...');
    await supabase.rpc('execute_sql', { 
      sql: 'ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_stage_check' 
    });
    
    // Step 2: Add new constraint with actual Zoho stages
    console.log('   2. Adding new stage constraint with actual Zoho stages...');
    const constraintSQL = `ALTER TABLE deals ADD CONSTRAINT deals_stage_check CHECK (stage IN (
      'New Deal',
      'Pre-Vet',
      'Sent for Signature',
      'Signed Application',
      'Sent to Underwriting',
      'App Pended',
      'Approved',
      'Declined',
      'Dead / Do Not Contact',
      'Merchant Unresponsive',
      'App Withdrawn',
      'Approved - Closed',
      'Conditionally Approved'
    ))`;
    
    await supabase.rpc('execute_sql', { sql: constraintSQL });
    
    // Step 3: Update default stage
    console.log('   3. Setting default stage to "New Deal"...');
    await supabase.rpc('execute_sql', { 
      sql: "ALTER TABLE deals ALTER COLUMN stage SET DEFAULT 'New Deal'" 
    });
    
    // Step 4: Update existing deals with invalid stages
    console.log('   4. Updating existing deals with invalid stages...');
    const updateSQL = `UPDATE deals SET stage = 'New Deal' WHERE stage NOT IN (
      'New Deal',
      'Pre-Vet',
      'Sent for Signature',
      'Signed Application',
      'Sent to Underwriting',
      'App Pended',
      'Approved',
      'Declined',
      'Dead / Do Not Contact',
      'Merchant Unresponsive',
      'App Withdrawn',
      'Approved - Closed',
      'Conditionally Approved'
    )`;
    
    await supabase.rpc('execute_sql', { sql: updateSQL });
    
    // Step 5: Add comment
    console.log('   5. Adding documentation comment...');
    await supabase.rpc('execute_sql', { 
      sql: "COMMENT ON COLUMN deals.stage IS 'Deal stage from Zoho CRM - updated with actual stages from API'" 
    });
    
    console.log('✅ Migration 015 applied successfully!');
    console.log('');
    console.log('🎯 Actual Zoho Stages Now Supported:');
    const stages = [
      'New Deal', 'Pre-Vet', 'Sent for Signature', 'Signed Application',
      'Sent to Underwriting', 'App Pended', 'Approved', 'Declined',
      'Dead / Do Not Contact', 'Merchant Unresponsive', 'App Withdrawn',
      'Approved - Closed', 'Conditionally Approved'
    ];
    
    stages.forEach(stage => console.log(`   • ${stage}`));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
