/**
 * Webhook Testing Script
 * 
 * Tests all 4 Zoho webhooks with sample payloads
 * 
 * Usage: node backend/scripts/test-webhooks.js [webhook-name]
 * 
 * Examples:
 *   node backend/scripts/test-webhooks.js partner
 *   node backend/scripts/test-webhooks.js contact
 *   node backend/scripts/test-webhooks.js lead-status
 *   node backend/scripts/test-webhooks.js deal
 *   node backend/scripts/test-webhooks.js all
 */

const axios = require('axios');
require('dotenv').config();

// Get backend URL from environment or use default
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

async function testPartnerWebhook() {
  logSection('TEST 1: PARTNER WEBHOOK');
  
  const payload = {
    id: `test_partner_${Date.now()}`,
    VendorName: 'Test Partner LLC',
    Email: `test+${Date.now()}@testpartner.com`
  };

  log('Payload:', 'yellow');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/webhooks/zoho/partner`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    log('\n✅ SUCCESS', 'green');
    log('Status:', 'yellow');
    console.log(response.status);
    log('Response:', 'yellow');
    console.log(JSON.stringify(response.data, null, 2));

    return { success: true, data: response.data };
  } catch (error) {
    log('\n❌ FAILED', 'red');
    if (error.response) {
      log('Status:', 'yellow');
      console.log(error.response.status);
      log('Error:', 'yellow');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      log('Error:', 'yellow');
      console.log(error.message);
    }
    return { success: false, error: error.message };
  }
}

async function testContactWebhook(partnerZohoId) {
  logSection('TEST 2: CONTACT WEBHOOK');
  
  const payload = {
    id: `test_contact_${Date.now()}`,
    First_Name: 'John',
    Last_Name: 'Doe',
    Email: `john+${Date.now()}@testpartner.com`,
    Vendor: { id: partnerZohoId || 'test_partner_123' }
  };

  log('Payload:', 'yellow');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/webhooks/zoho/contact`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    log('\n✅ SUCCESS', 'green');
    log('Status:', 'yellow');
    console.log(response.status);
    log('Response:', 'yellow');
    console.log(JSON.stringify(response.data, null, 2));

    return { success: true, data: response.data };
  } catch (error) {
    log('\n❌ FAILED', 'red');
    if (error.response) {
      log('Status:', 'yellow');
      console.log(error.response.status);
      log('Error:', 'yellow');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      log('Error:', 'yellow');
      console.log(error.message);
    }
    return { success: false, error: error.message };
  }
}

async function testLeadStatusWebhook() {
  logSection('TEST 3: LEAD STATUS WEBHOOK');
  
  log('⚠️  NOTE: This test requires an existing lead in the database', 'yellow');
  log('If you don\'t have a lead, this test will fail with "Lead not found"', 'yellow');
  log('You can create a lead first via the portal UI\n', 'yellow');

  const payload = {
    id: 'test_zoho_lead_id', // Replace with actual Zoho lead ID
    Lead_Status: 'Contacted',
    StrategicPartnerId: 'test_partner_123'
  };

  log('Payload:', 'yellow');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/webhooks/zoho/lead-status`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    log('\n✅ SUCCESS', 'green');
    log('Status:', 'yellow');
    console.log(response.status);
    log('Response:', 'yellow');
    console.log(JSON.stringify(response.data, null, 2));

    return { success: true, data: response.data };
  } catch (error) {
    log('\n❌ FAILED (Expected if no lead exists)', 'red');
    if (error.response) {
      log('Status:', 'yellow');
      console.log(error.response.status);
      log('Error:', 'yellow');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      log('Error:', 'yellow');
      console.log(error.message);
    }
    return { success: false, error: error.message };
  }
}

async function testDealWebhook(partnerZohoId) {
  logSection('TEST 4: DEAL WEBHOOK');
  
  const payload = {
    id: `test_deal_${Date.now()}`,
    Deal_Name: 'Test Deal',
    Stage: 'New Deal',
    Partners_Id: partnerZohoId || 'test_partner_123',
    Business_Name: 'Test Business Inc',
    Contact_First_Name: 'Jane',
    Contact_Name: 'Jane Smith',
    Approval_Time_Stamp: new Date().toISOString()
  };

  log('Payload:', 'yellow');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/webhooks/zoho/deal`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    log('\n✅ SUCCESS', 'green');
    log('Status:', 'yellow');
    console.log(response.status);
    log('Response:', 'yellow');
    console.log(JSON.stringify(response.data, null, 2));

    return { success: true, data: response.data };
  } catch (error) {
    log('\n❌ FAILED', 'red');
    if (error.response) {
      log('Status:', 'yellow');
      console.log(error.response.status);
      log('Error:', 'yellow');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      log('Error:', 'yellow');
      console.log(error.message);
    }
    return { success: false, error: error.message };
  }
}

async function testAllWebhooks() {
  log('\n╔' + '═'.repeat(78) + '╗', 'cyan');
  log('║' + ' '.repeat(25) + 'WEBHOOK TESTING SUITE' + ' '.repeat(32) + '║', 'cyan');
  log('╚' + '═'.repeat(78) + '╝', 'cyan');
  
  log(`\nBackend URL: ${BACKEND_URL}`, 'blue');
  log('Starting webhook tests...\n', 'blue');

  const results = {
    partner: null,
    contact: null,
    leadStatus: null,
    deal: null
  };

  // Test 1: Partner webhook
  results.partner = await testPartnerWebhook();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

  // Get partner Zoho ID from successful partner creation
  const partnerZohoId = results.partner.success 
    ? results.partner.data.data?.partner_id 
    : null;

  // Test 2: Contact webhook (uses partner from test 1)
  results.contact = await testContactWebhook(partnerZohoId);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Lead status webhook (requires existing lead)
  results.leadStatus = await testLeadStatusWebhook();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4: Deal webhook (uses partner from test 1)
  results.deal = await testDealWebhook(partnerZohoId);

  // Summary
  logSection('TEST SUMMARY');
  
  const tests = [
    { name: 'Partner Webhook', result: results.partner },
    { name: 'Contact Webhook', result: results.contact },
    { name: 'Lead Status Webhook', result: results.leadStatus },
    { name: 'Deal Webhook', result: results.deal }
  ];

  tests.forEach(test => {
    const status = test.result.success ? '✅ PASS' : '❌ FAIL';
    const color = test.result.success ? 'green' : 'red';
    log(`${status} - ${test.name}`, color);
  });

  const passCount = tests.filter(t => t.result.success).length;
  const totalCount = tests.length;

  log(`\nResults: ${passCount}/${totalCount} tests passed`, passCount === totalCount ? 'green' : 'yellow');

  if (passCount < totalCount) {
    log('\n⚠️  Some tests failed. Check the output above for details.', 'yellow');
    log('Note: Lead Status test is expected to fail if no lead exists in database.', 'yellow');
  }

  console.log('\n');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testName = args[0] || 'all';

  try {
    switch (testName.toLowerCase()) {
      case 'partner':
        await testPartnerWebhook();
        break;
      case 'contact':
        await testContactWebhook();
        break;
      case 'lead-status':
      case 'leadstatus':
        await testLeadStatusWebhook();
        break;
      case 'deal':
        await testDealWebhook();
        break;
      case 'all':
      default:
        await testAllWebhooks();
        break;
    }
  } catch (error) {
    log('\n❌ Unexpected error:', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();

