#!/usr/bin/env node

/**
 * Apply Migration 022: Agent/ISO Handling (Direct PostgreSQL Connection)
 * 
 * This script applies the Phase 7 migration using direct PostgreSQL connection
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// PostgreSQL configuration from Supabase
let connectionString = process.env.DATABASE_URL;

// If DATABASE_URL is not set, construct it from SUPABASE_URL
if (!connectionString) {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('❌ Error: DATABASE_URL or SUPABASE_URL must be set in .env file');
    process.exit(1);
  }
  
  // Extract project ref from Supabase URL (e.g., cvzadrvtncnjanoehzhj from https://cvzadrvtncnjanoehzhj.supabase.co)
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.error('❌ Error: Could not extract project reference from SUPABASE_URL');
    process.exit(1);
  }
  
  // Construct DATABASE_URL using pooler connection
  connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  console.log('ℹ️  Using constructed DATABASE_URL from SUPABASE_URL\n');
}

async function applyMigration() {
  console.log('🚀 Starting Migration 022: Agent/ISO Handling\n');

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

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

    // Execute migration
    console.log('⏳ Executing migration...\n');
    
    await client.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');

    // Verify migration
    console.log('🔍 Verifying migration...\n');

    // Check if partner_type column exists
    const partnersCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'partners' 
      AND column_name = 'partner_type'
    `);

    if (partnersCheck.rows.length > 0) {
      console.log('   ✅ partner_type column added to partners table');
    } else {
      console.log('   ❌ partner_type column NOT found in partners table');
    }

    // Check if assigned_agent_id column exists in leads
    const leadsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND column_name = 'assigned_agent_id'
    `);

    if (leadsCheck.rows.length > 0) {
      console.log('   ✅ assigned_agent_id column added to leads table');
    } else {
      console.log('   ❌ assigned_agent_id column NOT found in leads table');
    }

    // Check if assigned_agent_id column exists in deals
    const dealsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'deals' 
      AND column_name = 'assigned_agent_id'
    `);

    if (dealsCheck.rows.length > 0) {
      console.log('   ✅ assigned_agent_id column added to deals table');
    } else {
      console.log('   ❌ assigned_agent_id column NOT found in deals table');
    }

    // Check indexes
    const indexCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('partners', 'leads', 'deals')
      AND indexname IN (
        'idx_partners_partner_type',
        'idx_leads_assigned_agent',
        'idx_deals_assigned_agent',
        'idx_leads_partner_assigned_agent'
      )
    `);

    console.log(`   ✅ Created ${indexCheck.rows.length} performance indexes`);

    // Check functions
    const functionCheck = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      AND routine_name IN (
        'is_agent_or_iso',
        'get_agent_assigned_leads',
        'get_agent_assigned_deals'
      )
    `);

    console.log(`   ✅ Created ${functionCheck.rows.length} helper functions`);

    // Check triggers
    const triggerCheck = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name IN (
        'log_lead_agent_assignment',
        'log_deal_agent_assignment'
      )
    `);

    console.log(`   ✅ Created ${triggerCheck.rows.length} triggers`);

    console.log('\n✅ Migration 022 completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Update backend API to handle partner types');
    console.log('   2. Update frontend UI for agent/ISO users');
    console.log('   3. Test agent lead assignment functionality');
    console.log('   4. Deploy backend and frontend changes');
    console.log('   5. Configure Zoho webhooks to include agent assignments\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
applyMigration();




