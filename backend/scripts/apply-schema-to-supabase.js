require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key (has admin privileges)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySchema() {
  console.log('🚀 Starting database schema application...\n');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/supabase_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded successfully');
    console.log('📊 Applying schema to Supabase...\n');
    
    // Split the schema into individual statements
    // We need to execute them one by one for better error handling
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue;
      }
      
      // Extract a description from the statement
      let description = 'Executing statement';
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
        description = match ? `Creating table: ${match[1]}` : 'Creating table';
      } else if (statement.includes('CREATE INDEX')) {
        const match = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/i);
        description = match ? `Creating index: ${match[1]}` : 'Creating index';
      } else if (statement.includes('CREATE POLICY')) {
        const match = statement.match(/CREATE POLICY "([^"]+)"/i);
        description = match ? `Creating policy: ${match[1]}` : 'Creating policy';
      } else if (statement.includes('CREATE TRIGGER')) {
        const match = statement.match(/CREATE TRIGGER (\w+)/i);
        description = match ? `Creating trigger: ${match[1]}` : 'Creating trigger';
      } else if (statement.includes('CREATE FUNCTION') || statement.includes('CREATE OR REPLACE FUNCTION')) {
        const match = statement.match(/FUNCTION (\w+)/i);
        description = match ? `Creating function: ${match[1]}` : 'Creating function';
      } else if (statement.includes('ALTER TABLE')) {
        const match = statement.match(/ALTER TABLE (\w+)/i);
        description = match ? `Altering table: ${match[1]}` : 'Altering table';
      }
      
      process.stdout.write(`[${i + 1}/${statements.length}] ${description}... `);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Check if it's a "already exists" error - we can skip these
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate')) {
            console.log('⏭️  (already exists)');
            skipCount++;
          } else {
            console.log('❌');
            console.error('   Error:', error.message);
            errorCount++;
          }
        } else {
          console.log('✅');
          successCount++;
        }
      } catch (err) {
        console.log('❌');
        console.error('   Exception:', err.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCHEMA APPLICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully executed: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total statements: ${statements.length}`);
    console.log('='.repeat(60));
    
    if (errorCount === 0) {
      console.log('\n🎉 Schema application completed successfully!');
      
      // Verify tables were created
      console.log('\n🔍 Verifying tables...');
      await verifyTables();
    } else {
      console.log('\n⚠️  Schema application completed with errors. Please review the errors above.');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error during schema application:');
    console.error(error);
    process.exit(1);
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
  
  try {
    // Query to list all tables in public schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', expectedTables);
    
    if (error) {
      console.log('⚠️  Could not verify tables:', error.message);
      return;
    }
    
    console.log('\nExpected tables:');
    expectedTables.forEach(table => {
      const exists = data?.some(t => t.table_name === table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });
    
  } catch (error) {
    console.log('⚠️  Table verification failed:', error.message);
  }
}

// Run the schema application
applySchema().catch(console.error);

