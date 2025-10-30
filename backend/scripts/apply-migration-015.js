const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying migration 015: Update Deal Stages with Actual Zoho Stages...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/015_update_deal_stages_with_actual_zoho_stages.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('execute_sql', { 
        sql: statement 
      });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        throw error;
      }
    }
    
    console.log('✅ Migration 015 applied successfully!');
    console.log('');
    console.log('📋 Changes applied:');
    console.log('   ✅ Updated stage constraints with actual Zoho CRM stages');
    console.log('   ✅ Set default stage to "New Deal"');
    console.log('   ✅ Updated existing deals with invalid stages');
    console.log('   ✅ Added documentation comment');
    console.log('');
    console.log('🎯 Actual Zoho Stages Now Supported:');
    console.log('   • New Deal');
    console.log('   • Pre-Vet');
    console.log('   • Sent for Signature');
    console.log('   • Signed Application');
    console.log('   • Sent to Underwriting');
    console.log('   • App Pended');
    console.log('   • Approved');
    console.log('   • Declined');
    console.log('   • Dead / Do Not Contact');
    console.log('   • Merchant Unresponsive');
    console.log('   • App Withdrawn');
    console.log('   • Approved - Closed');
    console.log('   • Conditionally Approved');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
