#!/usr/bin/env node

/**
 * Cleanup test data automatically (non-interactive)
 * 
 * Usage: node scripts/cleanup-test-data-auto.js
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

async function cleanupTestLeads() {
  console.log('\n🔍 Finding test leads...\n');
  
  const testPatterns = ['test@', 'Test ', 'test ', 'santitest@'];
  
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, zoho_lead_id, first_name, last_name, email, status, created_at');
  
  if (error) {
    console.error('❌ Error fetching leads:', error);
    return 0;
  }
  
  const testLeads = leads.filter(lead => 
    testPatterns.some(pattern => 
      lead.first_name?.includes(pattern) ||
      lead.last_name?.includes(pattern) ||
      lead.email?.includes(pattern)
    )
  );
  
  if (testLeads.length === 0) {
    console.log('✅ No test leads found');
    return 0;
  }
  
  console.log(`Found ${testLeads.length} test leads:\n`);
  testLeads.forEach(lead => {
    console.log(`  - ${lead.first_name} ${lead.last_name} (${lead.email})`);
  });
  
  console.log('\n🗑️  Deleting test leads...\n');
  
  let deleted = 0;
  for (const lead of testLeads) {
    // Delete history first
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
      console.error(`  ❌ Error deleting ${lead.email}:`, error.message);
    } else {
      console.log(`  ✅ Deleted: ${lead.first_name} ${lead.last_name}`);
      deleted++;
    }
  }
  
  return deleted;
}

async function cleanupTestDeals() {
  console.log('\n🔍 Finding test deals...\n');
  
  const testPatterns = ['test@', 'Test ', 'test ', 'curl', 'Postman'];
  
  const { data: deals, error } = await supabase
    .from('deals')
    .select('id, zoho_deal_id, deal_name, company, email, stage, created_at');
  
  if (error) {
    console.error('❌ Error fetching deals:', error);
    return 0;
  }
  
  const testDeals = deals.filter(deal => 
    testPatterns.some(pattern => 
      deal.deal_name?.includes(pattern) ||
      deal.company?.includes(pattern) ||
      deal.email?.includes(pattern)
    )
  );
  
  if (testDeals.length === 0) {
    console.log('✅ No test deals found');
    return 0;
  }
  
  console.log(`Found ${testDeals.length} test deals:\n`);
  testDeals.forEach(deal => {
    console.log(`  - ${deal.deal_name} / ${deal.company} (${deal.email})`);
  });
  
  console.log('\n🗑️  Deleting test deals...\n');
  
  let deleted = 0;
  for (const deal of testDeals) {
    // Delete history first
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
        console.error(`  ❌ Error deleting ${deal.deal_name}:`, error.message);
      } else {
        console.log(`  ✅ Deleted: ${deal.deal_name}`);
        deleted++;
      }
  }
  
  return deleted;
}

async function cleanupDuplicateDeals() {
  console.log('\n🔍 Finding duplicate deals...\n');
  
  const { data: deals, error } = await supabase
    .from('deals')
    .select('id, zoho_deal_id, deal_name, company, stage, created_at')
    .order('zoho_deal_id')
    .order('created_at');
  
  if (error) {
    console.error('❌ Error fetching deals:', error);
    return 0;
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
  const duplicates = Object.entries(grouped)
    .filter(([_, dealList]) => dealList.length > 1)
    .map(([zohoId, dealList]) => ({ zoho_deal_id: zohoId, deals: dealList }));
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate deals found');
    return 0;
  }
  
  console.log(`Found ${duplicates.length} duplicate deal groups:\n`);
  duplicates.forEach(dup => {
    console.log(`  Zoho ID: ${dup.zoho_deal_id}`);
    dup.deals.forEach((deal, i) => {
      console.log(`    ${i === 0 ? '✅ KEEP' : '❌ DELETE'}: ${deal.deal_name} (${deal.created_at})`);
    });
  });
  
  console.log('\n🗑️  Deleting duplicate deals (keeping oldest)...\n');
  
  let deleted = 0;
  for (const dup of duplicates) {
    const toDelete = dup.deals.slice(1); // Keep first (oldest)
    
    for (const deal of toDelete) {
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
        console.error(`  ❌ Error deleting ${deal.id}:`, error.message);
      } else {
        console.log(`  ✅ Deleted duplicate: ${deal.deal_name}`);
        deleted++;
      }
    }
  }
  
  return deleted;
}

async function cleanupDuplicateLeads() {
  console.log('\n🔍 Finding duplicate leads...\n');
  
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, zoho_lead_id, first_name, last_name, email, status, created_at')
    .order('zoho_lead_id')
    .order('created_at');
  
  if (error) {
    console.error('❌ Error fetching leads:', error);
    return 0;
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
  const duplicates = Object.entries(grouped)
    .filter(([_, leadList]) => leadList.length > 1)
    .map(([zohoId, leadList]) => ({ zoho_lead_id: zohoId, leads: leadList }));
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate leads found');
    return 0;
  }
  
  console.log(`Found ${duplicates.length} duplicate lead groups:\n`);
  duplicates.forEach(dup => {
    console.log(`  Zoho ID: ${dup.zoho_lead_id}`);
    dup.leads.forEach((lead, i) => {
      console.log(`    ${i === 0 ? '✅ KEEP' : '❌ DELETE'}: ${lead.first_name} ${lead.last_name} (${lead.created_at})`);
    });
  });
  
  console.log('\n🗑️  Deleting duplicate leads (keeping oldest)...\n');
  
  let deleted = 0;
  for (const dup of duplicates) {
    const toDelete = dup.leads.slice(1); // Keep first (oldest)
    
    for (const lead of toDelete) {
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
        console.error(`  ❌ Error deleting ${lead.id}:`, error.message);
      } else {
        console.log(`  ✅ Deleted duplicate: ${lead.first_name} ${lead.last_name}`);
        deleted++;
      }
    }
  }
  
  return deleted;
}

async function main() {
  console.log('🧹 Database Cleanup Tool (Auto Mode)\n');
  console.log('This will automatically remove test data and duplicates.\n');
  
  let totalDeleted = 0;
  
  totalDeleted += await cleanupTestLeads();
  totalDeleted += await cleanupTestDeals();
  totalDeleted += await cleanupDuplicateLeads();
  totalDeleted += await cleanupDuplicateDeals();
  
  console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} records.\n`);
  console.log('💡 You can now run the sync to get fresh data from Zoho.\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

