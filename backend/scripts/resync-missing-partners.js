#!/usr/bin/env node
/**
 * Re-sync Missing Partners from Zoho to Portal
 * 
 * This script manually triggers the partner webhook for partners that exist
 * in Zoho CRM but are missing from the portal database.
 * 
 * Run: node scripts/resync-missing-partners.js
 */

const axios = require('axios');

const WEBHOOK_URL = 'https://backend-production-67e9.up.railway.app/api/webhooks/zoho/partner';

const missingPartners = [
  {
    id: '5577028000057060042',
    VendorName: 'Proven Prep.',
    Email: 'kylecurtis2@gmail.com',
    Vendor_Type: 'Strategic Partner (Referral)'
  },
  {
    id: '5577028000056852133',
    VendorName: 'Monarch Master Injections',
    Email: 'spriddy@masterinjectorsinc.com',
    Vendor_Type: 'Strategic Partner (Referral)'
  },
  {
    id: '5577028000056842086',
    VendorName: 'BridgerPay',
    Email: 'matthew.b@bridgerpay.com',
    Vendor_Type: 'Strategic Partner (Referral)'
  },
  {
    id: '5577028000056769037',
    VendorName: 'PrimeBridge Payment Solutions',
    Email: 'info@primebridgepay.com',
    Vendor_Type: 'Agent/ISO'
  },
  {
    id: '5577028000056733058',
    VendorName: 'Bryan Haver',
    Email: 'BryanHaver7@gmail.com',
    Vendor_Type: 'Strategic Partner (Referral)'
  },
  {
    id: '5577028000056588069',
    VendorName: 'TEST',
    Email: 'test@test.com',
    Vendor_Type: 'To be determined'
  },
  {
    id: '5577028000056606108',
    VendorName: 'Austin Higgins',
    Email: 'austin@air.ai',
    Vendor_Type: 'Strategic Partner (Referral)'
  },
  {
    id: '5577028000056505301',
    VendorName: 'International Payments Solutions',
    Email: 'dylan.gaines@intpaysol.com',
    Vendor_Type: 'Agent/ISO'
  },
  {
    id: '5577028000056505111',
    VendorName: 'Growth Vero',
    Email: 'sales@growthvero.com',
    Vendor_Type: 'Strategic Partner (Referral)'
  },
  {
    id: '5577028000055628245',
    VendorName: 'Fulfilment',
    Email: 'adam.tattan@fulfilment.com',
    Vendor_Type: 'Strategic Partner (Referral)'
  }
];

async function resyncPartner(partner) {
  try {
    console.log(`\n📤 Syncing: ${partner.VendorName} (${partner.Email})...`);
    
    const response = await axios.post(WEBHOOK_URL, partner, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data.success) {
      console.log(`✅ SUCCESS: Partner created`);
      console.log(`   Partner ID: ${response.data.data.partner_id}`);
      console.log(`   User ID: ${response.data.data.user_id}`);
      return { success: true, partner: partner.VendorName };
    } else {
      console.log(`⚠️  UNEXPECTED RESPONSE:`, response.data);
      return { success: false, partner: partner.VendorName, error: 'Unexpected response' };
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ FAILED: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      console.log(`   Details: ${error.response.data?.details || 'No details'}`);
      return { success: false, partner: partner.VendorName, error: error.response.data?.details };
    } else {
      console.log(`❌ FAILED: ${error.message}`);
      return { success: false, partner: partner.VendorName, error: error.message };
    }
  }
}

async function resyncAll() {
  console.log('🔄 Starting Partner Re-sync Process');
  console.log(`📊 Total partners to sync: ${missingPartners.length}`);
  console.log(`🎯 Target: ${WEBHOOK_URL}\n`);
  console.log('=' .repeat(70));
  
  const results = [];
  
  for (const partner of missingPartners) {
    const result = await resyncPartner(partner);
    results.push(result);
    
    // Wait 500ms between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 SYNC SUMMARY:');
  console.log(`   Total: ${results.length}`);
  console.log(`   ✅ Successful: ${results.filter(r => r.success).length}`);
  console.log(`   ❌ Failed: ${results.filter(r => !r.success).length}`);
  
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('\n❌ Failed Partners:');
    failed.forEach(f => {
      console.log(`   - ${f.partner}: ${f.error}`);
    });
  }
  
  console.log('\n✨ Re-sync process complete!');
}

// Run the script
resyncAll().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
