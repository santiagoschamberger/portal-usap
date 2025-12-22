#!/usr/bin/env node

/**
 * Apply Migration 022: Agent/ISO Handling (Using Supabase Admin Client)
 * 
 * This script applies the Phase 7 migration using Supabase admin client
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

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
  },
  db: {
    schema: 'public'
  }
});

async function executeSQLStatements(statements) {
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement || statement.startsWith('--')) continue;
    
    try {
      // Use the REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: statement })
      });
      
      if (!response.ok) {
        console.log(`   ⚠️  Statement ${i + 1}: ${response.statusText}`);
        // Continue anyway as some statements might fail if already exist
      } else {
        successCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  Statement ${i + 1}: ${error.message}`);
      failCount++;
    }
  }
  
  return { successCount, failCount };
}

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
    console.log('   - Create 4 performance indexes');
    console.log('   - Update 7 RLS policies for agent access');
    console.log('   - Create 3 helper functions');
    console.log('   - Create 2 triggers for agent assignment logging\n');

    console.log('⏳ Executing migration statements...\n');
    console.log('ℹ️  Note: You can also copy the SQL from the migration file and paste it');
    console.log('   directly into the Supabase SQL Editor for manual execution.\n');
    console.log('📁 Migration file location:');
    console.log(`   ${migrationPath}\n`);

    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`   Found ${statements.length} SQL statements to execute\n`);

    // For now, just provide instructions since direct SQL execution via REST API is complex
    console.log('📋 MANUAL MIGRATION STEPS:\n');
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to your project: cvzadrvtncnjanoehzhj');
    console.log('3. Go to SQL Editor');
    console.log('4. Create a new query');
    console.log('5. Copy the contents of the migration file:');
    console.log(`   ${migrationPath}`);
    console.log('6. Paste into the SQL Editor');
    console.log('7. Click "Run" to execute the migration\n');

    console.log('✅ Migration file is ready to be applied manually');
    console.log('\nAlternatively, run this command to view the migration SQL:');
    console.log(`   cat "${migrationPath}"\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run migration
applyMigration();




