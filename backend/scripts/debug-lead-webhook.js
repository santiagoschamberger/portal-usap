#!/usr/bin/env node

/**
 * Debug script for lead webhook issues
 * 
 * This script investigates:
 * 1. Why StrategicPartnerId is empty in webhook
 * 2. Why lead is not found in local database
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ZOHO_LEAD_ID = '5577028000048552001';

async function debugLeadWebhook() {
  console.log('🔍 Debugging Lead Webhook Issues\n');
  console.log('=' .repeat(60));
  
  // 1. Check if lead exists in database
  console.log('\n1️⃣ Checking if lead exists in local database...\n');
  
  const { data: leadByZohoId, error: zohoIdError } = await supabase
    .from('leads')
    .select('*')
    .eq('zoho_lead_id', ZOHO_LEAD_ID)
    .maybeSingle();
  
  if (zohoIdError) {
    console.error('❌ Error querying by zoho_lead_id:', zohoIdError);
  } else if (leadByZohoId) {
    console.log('✅ Lead FOUND by zoho_lead_id:', ZOHO_LEAD_ID);
    console.log('\nLead Details:');
    console.log('  - Local ID:', leadByZohoId.id);
    console.log('  - Partner ID:', leadByZohoId.partner_id);
    console.log('  - Created By:', leadByZohoId.created_by);
    console.log('  - Name:', leadByZohoId.first_name, leadByZohoId.last_name);
    console.log('  - Email:', leadByZohoId.email);
    console.log('  - Company:', leadByZohoId.company);
    console.log('  - Status:', leadByZohoId.status);
    console.log('  - Zoho Lead ID:', leadByZohoId.zoho_lead_id);
    console.log('  - Zoho Sync Status:', leadByZohoId.zoho_sync_status);
    console.log('  - Created At:', leadByZohoId.created_at);
    console.log('  - Last Sync:', leadByZohoId.last_sync_at);
  } else {
    console.log('❌ Lead NOT FOUND by zoho_lead_id:', ZOHO_LEAD_ID);
  }
  
  // 2. Check all recent leads to see if any might match
  console.log('\n2️⃣ Checking recent leads (last 10)...\n');
  
  const { data: recentLeads, error: recentError } = await supabase
    .from('leads')
    .select('id, first_name, last_name, email, company, zoho_lead_id, zoho_sync_status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (recentError) {
    console.error('❌ Error fetching recent leads:', recentError);
  } else if (recentLeads && recentLeads.length > 0) {
    console.log(`Found ${recentLeads.length} recent leads:\n`);
    recentLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.first_name} ${lead.last_name} (${lead.email})`);
      console.log(`   Company: ${lead.company || 'N/A'}`);
      console.log(`   Zoho ID: ${lead.zoho_lead_id || 'NOT SYNCED'}`);
      console.log(`   Sync Status: ${lead.zoho_sync_status}`);
      console.log(`   Created: ${lead.created_at}`);
      console.log('');
    });
  } else {
    console.log('No recent leads found.');
  }
  
  // 3. Check if there are any leads with null zoho_lead_id
  console.log('\n3️⃣ Checking for leads with missing Zoho IDs...\n');
  
  const { data: unsyncedLeads, error: unsyncedError } = await supabase
    .from('leads')
    .select('id, first_name, last_name, email, zoho_sync_status, created_at')
    .is('zoho_lead_id', null)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (unsyncedError) {
    console.error('❌ Error fetching unsynced leads:', unsyncedError);
  } else if (unsyncedLeads && unsyncedLeads.length > 0) {
    console.log(`⚠️  Found ${unsyncedLeads.length} leads without Zoho IDs:\n`);
    unsyncedLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.first_name} ${lead.last_name} (${lead.email})`);
      console.log(`   Sync Status: ${lead.zoho_sync_status}`);
      console.log(`   Created: ${lead.created_at}`);
      console.log('');
    });
  } else {
    console.log('✅ All leads have Zoho IDs.');
  }
  
  // 4. Check the partner and user info
  if (leadByZohoId) {
    console.log('\n4️⃣ Checking Partner and User information...\n');
    
    // Get partner info
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, name, email, zoho_partner_id')
      .eq('id', leadByZohoId.partner_id)
      .single();
    
    if (partnerError) {
      console.error('❌ Error fetching partner:', partnerError);
    } else if (partner) {
      console.log('Partner Details:');
      console.log('  - ID:', partner.id);
      console.log('  - Name:', partner.name);
      console.log('  - Email:', partner.email);
      console.log('  - Zoho Partner ID:', partner.zoho_partner_id);
    }
    
    // Get user info (creator)
    if (leadByZohoId.created_by) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, partner_id')
        .eq('id', leadByZohoId.created_by)
        .single();
      
      if (userError) {
        console.error('❌ Error fetching user:', userError);
      } else if (user) {
        console.log('\nCreator (User) Details:');
        console.log('  - ID:', user.id);
        console.log('  - Name:', user.first_name, user.last_name);
        console.log('  - Email:', user.email);
        console.log('  - Role:', user.role);
        console.log('  - Partner ID:', user.partner_id);
        console.log('\n💡 This user ID should be sent as StrategicPartnerId to Zoho!');
      }
    } else {
      console.log('\n⚠️  Lead has no created_by user ID!');
    }
  }
  
  // 5. Recommendations
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 DIAGNOSIS & RECOMMENDATIONS:\n');
  
  if (!leadByZohoId) {
    console.log('❌ ISSUE 1: Lead not found in database');
    console.log('   Possible causes:');
    console.log('   a) Lead was created but Zoho sync failed');
    console.log('   b) Zoho ID mismatch (check data types)');
    console.log('   c) Lead was deleted or converted');
    console.log('');
    console.log('   Solutions:');
    console.log('   - Check recent leads above to find the lead');
    console.log('   - Verify the Zoho ID is correct in Zoho CRM');
    console.log('   - Check backend logs for lead creation errors');
  } else {
    console.log('✅ Lead exists in database - webhook lookup should work');
  }
  
  console.log('\n❌ ISSUE 2: StrategicPartnerId is empty in webhook');
  console.log('   Root cause:');
  console.log('   - Zoho webhooks only send changed fields by default');
  console.log('   - StrategicPartnerId is not included in status update webhooks');
  console.log('');
  console.log('   Solutions:');
  console.log('   A) Configure Zoho webhook to include StrategicPartnerId field');
  console.log('   B) Fetch full lead record from Zoho when webhook received');
  console.log('   C) Store StrategicPartnerId in local database during lead creation');
  console.log('      (then use local data instead of webhook data)');
  console.log('');
  console.log('   ⭐ RECOMMENDED: Option C - Use local database');
  console.log('      The lead already has created_by field with user ID');
  console.log('      No need to rely on Zoho webhook for this data');
  
  console.log('\n' + '='.repeat(60));
}

debugLeadWebhook()
  .then(() => {
    console.log('\n✅ Debug complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  });

