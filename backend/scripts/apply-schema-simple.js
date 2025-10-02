require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ SET' : '❌ MISSING');
  console.error('\n💡 Make sure these are set in your backend/.env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySchema() {
  console.log('🚀 Applying Database Schema to Supabase\n');
  console.log('Project URL:', supabaseUrl);
  console.log('Using service role key for admin access\n');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/supabase_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('✅ Schema file loaded successfully');
    console.log('📊 Preparing to execute SQL...\n');
    
    // Use Supabase REST API to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql: schema })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to execute schema:', error);
      console.log('\n📋 MANUAL APPLICATION REQUIRED');
      console.log('='.repeat(60));
      console.log('Please apply the schema manually:');
      console.log('1. Go to: https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Navigate to SQL Editor');
      console.log('4. Create a new query');
      console.log('5. Copy and paste the contents of:');
      console.log('   backend/database/supabase_schema.sql');
      console.log('6. Click "Run" to execute');
      console.log('='.repeat(60));
      return;
    }

    const result = await response.json();
    console.log('✅ Schema executed successfully!');
    console.log('\n🔍 Verifying tables...');
    
    await verifyTables();
    
  } catch (error) {
    console.error('\n❌ Error applying schema:', error.message);
    console.log('\n📋 MANUAL APPLICATION INSTRUCTIONS');
    console.log('='.repeat(60));
    console.log('Automatic application failed. Please apply manually:');
    console.log('');
    console.log('1. Open Supabase Dashboard:');
    console.log(`   ${supabaseUrl.replace('/rest/v1', '')}`);
    console.log('');
    console.log('2. Navigate to: SQL Editor → New query');
    console.log('');
    console.log('3. Copy the entire contents of:');
    console.log('   backend/database/supabase_schema.sql');
    console.log('');
    console.log('4. Paste into the SQL Editor');
    console.log('');
    console.log('5. Click "Run" to execute the schema');
    console.log('');
    console.log('6. Verify all tables are created successfully');
    console.log('='.repeat(60));
  }
}

async function verifyTables() {
  const expectedTables = [
    'partners',
    'users',
    'leads',
    'lead_status_history',
    'activity_log',
    'notifications'
  ];
  
  console.log('\nChecking for expected tables:');
  
  for (const table of expectedTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (error && error.code === '42P01') {
        // Table doesn't exist
        console.log(`  ❌ ${table} - NOT FOUND`);
      } else if (error) {
        console.log(`  ⚠️  ${table} - ${error.message}`);
      } else {
        console.log(`  ✅ ${table} - EXISTS`);
      }
    } catch (err) {
      console.log(`  ⚠️  ${table} - ${err.message}`);
    }
  }
  
  console.log('\n🎉 Schema verification complete!');
}

// Run the schema application
applySchema().catch(console.error);


