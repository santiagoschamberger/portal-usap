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
    console.log('🚀 Applying migration 014: Fix Deal Stages and Add Approval Date...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/014_fix_deal_stages_and_approval_date.sql');
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
    
    console.log('✅ Migration 014 applied successfully!');
    console.log('');
    console.log('📋 Changes applied:');
    console.log('   ✅ Added approval_date column to deals table');
    console.log('   ✅ Created index on approval_date column');
    console.log('   ✅ Updated existing deals with Qualification stage to Needs Analysis');
    console.log('   ✅ Removed Qualification from stage constraints');
    console.log('   ✅ Updated default stage to Needs Analysis');
    console.log('   ✅ Added column comments for documentation');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
