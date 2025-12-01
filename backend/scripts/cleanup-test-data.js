#!/usr/bin/env node

/**
 * Cleanup test data and duplicates from database
 * 
 * This script will:
 * 1. Show all duplicates (same zoho_deal_id or zoho_lead_id)
 * 2. Show test data (test emails, test names)
 * 3. Ask for confirmation before deleting
 * 4. Keep the OLDEST record for each zoho_id (first created)
 * 5. Delete newer duplicates
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function findDuplicateDeals() {
  console.log('\n🔍 Finding duplicate deals...\n');
  
  const { data: deals, error } = await supabase
    .from('deals')
    .select('id, zoho_deal_id, business_name, stage, created_at, partner_id')
    .order('zoho_deal_id')
    .order('created_at');
  
  if (error) {
    console.error('❌ Error fetching deals:', error);
    return [];
  }
  
  // Group by zoho_deal_id
  const grouped = {};
  deals.forEach(deal => {
    if (deal.zoho_deal_id) {
      if (!grouped[deal.zoho_deal_id]) {
        grouped[deal.zoho_deal_id] = [];
      }
      grouped[deal.zoho_deal_id].push(deal);
    }
  });
  
  // Find duplicates
  const duplicates = [];
  Object.entries(grouped).forEach(([zohoId, dealList]) => {
    if (dealList.length > 1) {
      duplicates.push({
        zoho_deal_id: zohoId,
        deals: dealList
      });
    }
  });
  
  return duplicates;
}

async function findDuplicateLeads() {
  console.log('\n🔍 Finding duplicate leads...\n');
  
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, zoho_lead_id, first_name, last_name, email, status, created_at, created_by')
    .order('zoho_lead_id')
    .order('created_at');
  
  if (error) {
    console.error('❌ Error fetching leads:', error);
    return [];
  }
  
  // Group by zoho_lead_id
  const grouped = {};
  leads.forEach(lead => {
    if (lead.zoho_lead_id) {
      if (!grouped[lead.zoho_lead_id]) {
        grouped[lead.zoho_lead_id] = [];
      }
      grouped[lead.zoho_lead_id].push(lead);
    }
  });
  
  // Find duplicates
  const duplicates = [];
  Object.entries(grouped).forEach(([zohoId, leadList]) => {
    if (leadList.length > 1) {
      duplicates.push({
        zoho_lead_id: zohoId,
        leads: leadList
      });
    }
  });
  
  return duplicates;
}

async function findTestData() {
  console.log('\n🔍 Finding test data...\n');
  
  const testPatterns = [
    'test@',
    'Test ',
    'test ',
    'curl',
    'Postman',
    'postman'
  ];
  
  const testDeals = [];
  const testLeads = [];
  
  // Find test deals
  const { data: deals } = await supabase
    .from('deals')
    .select('id, zoho_deal_id, business_name, contact_email, stage, created_at');
  
  deals?.forEach(deal => {
    const isTest = testPatterns.some(pattern => 
      deal.business_name?.includes(pattern) ||
      deal.contact_email?.includes(pattern)
    );
    if (isTest) {
      testDeals.push(deal);
    }
  });
  
  // Find test leads
  const { data: leads } = await supabase
    .from('leads')
    .select('id, zoho_lead_id, first_name, last_name, email, status, created_at');
  
  leads?.forEach(lead => {
    const isTest = testPatterns.some(pattern => 
      lead.first_name?.includes(pattern) ||
      lead.last_name?.includes(pattern) ||
      lead.email?.includes(pattern)
    );
    if (isTest) {
      testLeads.push(lead);
    }
  });
  
  return { testDeals, testLeads };
}

async function deleteDuplicates(duplicates, type) {
  console.log(`\n🗑️  Deleting duplicate ${type}s...\n`);
  
  let deleted = 0;
  
  for (const dup of duplicates) {
    const records = type === 'deal' ? dup.deals : dup.leads;
    
    // Keep the oldest (first created)
    const toKeep = records[0];
    const toDelete = records.slice(1);
    
    console.log(`📌 Keeping: ${toKeep.id} (created: ${toKeep.created_at})`);
    
    for (const record of toDelete) {
      console.log(`  ❌ Deleting: ${record.id} (created: ${record.created_at})`);
      
      // Delete related history first
      if (type === 'deal') {
        await supabase
          .from('deal_stage_history')
          .delete()
          .eq('deal_id', record.id);
      } else {
        await supabase
          .from('lead_status_history')
          .delete()
          .eq('lead_id', record.id);
      }
      
      // Delete the record
      const { error } = await supabase
        .from(type === 'deal' ? 'deals' : 'leads')
        .delete()
        .eq('id', record.id);
      
      if (error) {
        console.error(`    ❌ Error deleting ${record.id}:`, error.message);
      } else {
        deleted++;
      }
    }
    console.log('');
  }
  
  return deleted;
}

async function deleteTestData(testDeals, testLeads) {
  console.log('\n🗑️  Deleting test data...\n');
  
  let deleted = 0;
  
  // Delete test deals
  for (const deal of testDeals) {
    console.log(`  ❌ Deleting test deal: ${deal.business_name} (${deal.id})`);
    
    // Delete history
    await supabase
      .from('deal_stage_history')
      .delete()
      .eq('deal_id', deal.id);
    
    // Delete deal
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', deal.id);
    
    if (error) {
      console.error(`    ❌ Error:`, error.message);
    } else {
      deleted++;
    }
  }
  
  // Delete test leads
  for (const lead of testLeads) {
    console.log(`  ❌ Deleting test lead: ${lead.first_name} ${lead.last_name} (${lead.id})`);
    
    // Delete history
    await supabase
      .from('lead_status_history')
      .delete()
      .eq('lead_id', lead.id);
    
    // Delete lead
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', lead.id);
    
    if (error) {
      console.error(`    ❌ Error:`, error.message);
    } else {
      deleted++;
    }
  }
  
  return deleted;
}

async function main() {
  console.log('🧹 Database Cleanup Tool\n');
  console.log('This will help you remove duplicates and test data.\n');
  
  // Find all issues
  const duplicateDeals = await findDuplicateDeals();
  const duplicateLeads = await findDuplicateLeads();
  const { testDeals, testLeads } = await findTestData();
  
  // Show summary
  console.log('\n📊 Summary:\n');
  console.log(`  Duplicate deals: ${duplicateDeals.length} (${duplicateDeals.reduce((sum, d) => sum + d.deals.length - 1, 0)} records to delete)`);
  console.log(`  Duplicate leads: ${duplicateLeads.length} (${duplicateLeads.reduce((sum, d) => sum + d.leads.length - 1, 0)} records to delete)`);
  console.log(`  Test deals: ${testDeals.length}`);
  console.log(`  Test leads: ${testLeads.length}`);
  
  // Show details
  if (duplicateDeals.length > 0) {
    console.log('\n📋 Duplicate Deals:\n');
    duplicateDeals.forEach(dup => {
      console.log(`  Zoho ID: ${dup.zoho_deal_id}`);
      dup.deals.forEach((deal, i) => {
        console.log(`    ${i === 0 ? '✅ KEEP' : '❌ DELETE'}: ${deal.business_name} (${deal.id}) - ${deal.created_at}`);
      });
      console.log('');
    });
  }
  
  if (duplicateLeads.length > 0) {
    console.log('\n📋 Duplicate Leads:\n');
    duplicateLeads.forEach(dup => {
      console.log(`  Zoho ID: ${dup.zoho_lead_id}`);
      dup.leads.forEach((lead, i) => {
        console.log(`    ${i === 0 ? '✅ KEEP' : '❌ DELETE'}: ${lead.first_name} ${lead.last_name} (${lead.id}) - ${lead.created_at}`);
      });
      console.log('');
    });
  }
  
  if (testDeals.length > 0) {
    console.log('\n📋 Test Deals:\n');
    testDeals.forEach(deal => {
      console.log(`  ❌ ${deal.business_name} - ${deal.contact_email} (${deal.id})`);
    });
  }
  
  if (testLeads.length > 0) {
    console.log('\n📋 Test Leads:\n');
    testLeads.forEach(lead => {
      console.log(`  ❌ ${lead.first_name} ${lead.last_name} - ${lead.email} (${lead.id})`);
    });
  }
  
  // Ask for confirmation
  const totalToDelete = 
    duplicateDeals.reduce((sum, d) => sum + d.deals.length - 1, 0) +
    duplicateLeads.reduce((sum, d) => sum + d.leads.length - 1, 0) +
    testDeals.length +
    testLeads.length;
  
  if (totalToDelete === 0) {
    console.log('\n✅ No duplicates or test data found! Database is clean.\n');
    rl.close();
    return;
  }
  
  console.log(`\n⚠️  This will delete ${totalToDelete} records.\n`);
  const answer = await ask('Do you want to proceed? (yes/no): ');
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Cleanup cancelled.\n');
    rl.close();
    return;
  }
  
  // Perform cleanup
  let totalDeleted = 0;
  
  if (duplicateDeals.length > 0) {
    totalDeleted += await deleteDuplicates(duplicateDeals, 'deal');
  }
  
  if (duplicateLeads.length > 0) {
    totalDeleted += await deleteDuplicates(duplicateLeads, 'lead');
  }
  
  if (testDeals.length > 0 || testLeads.length > 0) {
    totalDeleted += await deleteTestData(testDeals, testLeads);
  }
  
  console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} records.\n`);
  console.log('💡 You can now run the sync to get fresh data from Zoho.\n');
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});

