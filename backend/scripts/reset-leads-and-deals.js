#!/usr/bin/env node

/**
 * Complete reset of leads and deals tables
 * 
 * This will:
 * 1. Delete ALL leads and their history
 * 2. Delete ALL deals and their history
 * 3. Prepare for a fresh sync from Zoho
 * 
 * ⚠️  WARNING: This is destructive! All lead and deal data will be lost.
 * 
 * Usage: node scripts/reset-leads-and-deals.js
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function countRecords() {
  console.log('\n📊 Current database state:\n');
  
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  
  const { count: dealsCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true });
  
  const { count: leadHistoryCount } = await supabase
    .from('lead_status_history')
    .select('*', { count: 'exact', head: true });
  
  const { count: dealHistoryCount } = await supabase
    .from('deal_stage_history')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Leads: ${leadsCount}`);
  console.log(`  Lead history records: ${leadHistoryCount}`);
  console.log(`  Deals: ${dealsCount}`);
  console.log(`  Deal history records: ${dealHistoryCount}`);
  console.log('');
  
  return {
    leadsCount,
    dealsCount,
    leadHistoryCount,
    dealHistoryCount
  };
}

async function deleteAllLeadHistory() {
  console.log('🗑️  Deleting all lead status history...');
  
  const { error, count } = await supabase
    .from('lead_status_history')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
  
  if (error) {
    console.error('❌ Error deleting lead history:', error);
    return 0;
  }
  
  console.log(`✅ Deleted all lead history records\n`);
  return count || 0;
}

async function deleteAllLeads() {
  console.log('🗑️  Deleting all leads...');
  
  const { error, count } = await supabase
    .from('leads')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
  
  if (error) {
    console.error('❌ Error deleting leads:', error);
    return 0;
  }
  
  console.log(`✅ Deleted all leads\n`);
  return count || 0;
}

async function deleteAllDealHistory() {
  console.log('🗑️  Deleting all deal stage history...');
  
  const { error, count } = await supabase
    .from('deal_stage_history')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
  
  if (error) {
    console.error('❌ Error deleting deal history:', error);
    return 0;
  }
  
  console.log(`✅ Deleted all deal history records\n`);
  return count || 0;
}

async function deleteAllDeals() {
  console.log('🗑️  Deleting all deals...');
  
  const { error, count } = await supabase
    .from('deals')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
  
  if (error) {
    console.error('❌ Error deleting deals:', error);
    return 0;
  }
  
  console.log(`✅ Deleted all deals\n`);
  return count || 0;
}

async function main() {
  console.log('🔄 Complete Reset: Leads & Deals\n');
  console.log('⚠️  WARNING: This will delete ALL leads and deals from the database!');
  console.log('⚠️  This action cannot be undone!\n');
  
  // Show current state
  const before = await countRecords();
  
  const totalRecords = 
    before.leadsCount + 
    before.dealsCount + 
    before.leadHistoryCount + 
    before.dealHistoryCount;
  
  if (totalRecords === 0) {
    console.log('✅ Database is already empty. Nothing to delete.\n');
    return;
  }
  
  console.log(`📦 Total records to delete: ${totalRecords}\n`);
  console.log('Starting deletion in 3 seconds...\n');
  
  // Give user a moment to cancel
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('🚀 Starting deletion...\n');
  
  // Delete in correct order (history first, then parent records)
  await deleteAllLeadHistory();
  await deleteAllLeads();
  await deleteAllDealHistory();
  await deleteAllDeals();
  
  // Show final state
  console.log('📊 Final database state:\n');
  const after = await countRecords();
  
  console.log('✅ Reset complete!\n');
  console.log('💡 Next steps:');
  console.log('   1. Go to the portal');
  console.log('   2. Click "Sync Now" to fetch fresh data from Zoho CRM');
  console.log('   3. All converted leads will be properly filtered out\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

