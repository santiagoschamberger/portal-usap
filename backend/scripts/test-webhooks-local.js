#!/usr/bin/env node

/**
 * Test webhooks locally without deploying
 * 
 * Usage:
 *   node scripts/test-webhooks-local.js deal
 *   node scripts/test-webhooks-local.js lead-status
 *   node scripts/test-webhooks-local.js contact
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5001';

// Test payloads
const testPayloads = {
  deal: {
    // Test deal webhook with empty contact info (will trigger Zoho API fetch)
    empty: {
      zohoDealId: '5577028000048531900',
      Deal_Name: 'Test Deal - Empty Contact',
      Stage: 'Sent to Underwriting',
      Email: '',
      Phone: '',
      First_Name: '',
      Last_Name: '',
      Account_Name: 'Test Company',
      StrategicPartnerId: '5577028000042584326',
      Approval_Time_Stamp: ''
    },
    // Test deal webhook with complete contact info
    complete: {
      zohoDealId: '5577028000048531900',
      Deal_Name: 'Test Deal - Complete',
      Stage: 'Sent to Underwriting',
      Email: 'santiago@test.com',
      Phone: '555-1234',
      First_Name: 'Santiago',
      Last_Name: 'Schamb',
      Account_Name: 'Hub',
      StrategicPartnerId: '5577028000042584326',
      Approval_Time_Stamp: ''
    }
  },
  
  leadStatus: {
    // Test lead status update
    update: {
      id: '5577028000048552001',
      Lead_Status: 'Contacted',
      StrategicPartnerId: ''
    },
    // Test lead conversion (should delete lead)
    converted: {
      id: '5577028000048552001',
      Lead_Status: 'Converted',
      StrategicPartnerId: ''
    }
  },
  
  contact: {
    // Test contact webhook (should be disabled)
    test: {
      id: '5577028000048533002',
      First_Name: 'Test',
      Last_Name: 'Contact',
      Email: 'test@contact.com',
      Vendor: {
        id: '5577028000042584326'
      }
    }
  }
};

async function testWebhook(type, variant = 'empty') {
  console.log('\n' + '='.repeat(60));
  console.log(`🧪 Testing ${type} webhook (${variant})`);
  console.log('='.repeat(60) + '\n');
  
  let endpoint, payload;
  
  switch (type) {
    case 'deal':
      endpoint = '/api/webhooks/zoho/deal';
      payload = testPayloads.deal[variant] || testPayloads.deal.empty;
      break;
    case 'lead-status':
      endpoint = '/api/webhooks/zoho/lead-status';
      payload = testPayloads.leadStatus[variant] || testPayloads.leadStatus.update;
      break;
    case 'contact':
      endpoint = '/api/webhooks/zoho/contact';
      payload = testPayloads.contact.test;
      break;
    default:
      console.error('❌ Unknown webhook type. Use: deal, lead-status, or contact');
      return;
  }
  
  console.log('📤 Sending to:', BASE_URL + endpoint);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  console.log('');
  
  try {
    const response = await axios.post(BASE_URL + endpoint, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response:', response.status, response.statusText);
    console.log('📥 Data:', JSON.stringify(response.data, null, 2));
    console.log('\n✅ Test passed!');
  } catch (error) {
    if (error.response) {
      console.error('❌ Response:', error.response.status, error.response.statusText);
      console.error('📥 Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Error:', error.message);
      console.error('💡 Make sure your backend is running on', BASE_URL);
    }
    console.log('\n❌ Test failed!');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Parse command line arguments
const args = process.argv.slice(2);
const webhookType = args[0];
const variant = args[1];

if (!webhookType) {
  console.log('Usage: node scripts/test-webhooks-local.js <type> [variant]');
  console.log('');
  console.log('Types:');
  console.log('  deal          - Test deal webhook');
  console.log('  lead-status   - Test lead status webhook');
  console.log('  contact       - Test contact webhook');
  console.log('');
  console.log('Variants for deal:');
  console.log('  empty         - Empty contact info (default)');
  console.log('  complete      - Complete contact info');
  console.log('');
  console.log('Variants for lead-status:');
  console.log('  update        - Status update (default)');
  console.log('  converted     - Lead converted to deal');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/test-webhooks-local.js deal');
  console.log('  node scripts/test-webhooks-local.js deal complete');
  console.log('  node scripts/test-webhooks-local.js lead-status converted');
  console.log('');
  console.log('Environment:');
  console.log('  API_URL=' + BASE_URL + ' (set API_URL to test against production)');
  process.exit(1);
}

testWebhook(webhookType, variant);

