/**
 * Test script for the deal webhook endpoint
 * This simulates a Zoho CRM webhook call to test the deal sync functionality
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const WEBHOOK_ENDPOINT = `${BACKEND_URL}/api/webhooks/zoho/deal`;

// Sample deal data based on USA Payments fields
const sampleDealData = {
  // Core Zoho fields
  id: "5725767000001234567",
  Deal_Name: "ABC Corp - Merchant Services Setup",
  Stage: "Qualification",
  Amount: "50000.00",
  Closing_Date: "2025-12-31",
  Probability: 75,
  Lead_Source: "Strategic Partner",
  
  // Partner linking (CRITICAL)
  StrategicPartnerId: "replace-with-actual-user-id", // User ID who created the lead
  Vendor: {
    id: "5725767000000987654", // Partner's Zoho ID
    name: "Test Partner Company"
  },
  
  // Contact information
  Account_Name: {
    name: "ABC Corp",
    id: "5725767000000111222"
  },
  Contact_Name: {
    name: "John Doe",
    email: "john@abccorp.com",
    phone: "555-1234"
  },
  Contact_Email: "john@abccorp.com",
  Contact_No: "555-1234",
  
  // USA Payments specific fields
  MID: "MERCHANT123456",
  MCC: "5812", // Restaurant
  Processor: "First Data",
  Currency: "USD",
  Dba_Name: "ABC Restaurant",
  Gateway_ID: "GW789012",
  Base_Account_Number: "1234567890",
  Base_Routing_Number: "021000021"
};

async function testDealWebhook() {
  console.log('🧪 Testing Deal Webhook...');
  console.log('📍 Endpoint:', WEBHOOK_ENDPOINT);
  console.log('📦 Payload:', JSON.stringify(sampleDealData, null, 2));
  
  try {
    const response = await axios.post(WEBHOOK_ENDPOINT, sampleDealData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Webhook Response:', response.status);
    console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('🎉 Deal webhook test PASSED!');
      console.log('💡 Deal ID:', response.data.data?.deal_id);
      console.log('💡 Partner ID:', response.data.data?.partner_id);
    } else {
      console.log('❌ Deal webhook test FAILED!');
      console.log('💡 Error:', response.data.error || response.data.message);
    }
    
  } catch (error) {
    console.log('❌ Webhook test FAILED with error:');
    
    if (error.response) {
      console.log('📄 Status:', error.response.status);
      console.log('📄 Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('📡 No response received. Check if backend is running.');
      console.log('📡 Request details:', error.message);
    } else {
      console.log('⚠️ Error:', error.message);
    }
  }
}

// Instructions for running the test
console.log(`
🔧 Deal Webhook Test Script
============================

Before running this test:

1. Make sure your backend is running (locally or on Railway)
2. Update the BACKEND_URL if testing against Railway:
   export BACKEND_URL=https://your-backend.up.railway.app

3. Replace 'StrategicPartnerId' with a real user ID from your database:
   - Query: SELECT id FROM users WHERE role = 'sub_account' LIMIT 1;
   - Update the sampleDealData.StrategicPartnerId value above

4. Replace 'Vendor.id' with a real partner Zoho ID:
   - Query: SELECT zoho_partner_id FROM partners WHERE approved = true LIMIT 1;
   - Update the sampleDealData.Vendor.id value above

5. Run the test:
   node backend/scripts/test-deal-webhook.js

Expected Results:
✅ Status 201 (new deal created) or 200 (existing deal updated)
✅ Response includes deal_id and partner_id
✅ Deal appears in database: SELECT * FROM deals ORDER BY created_at DESC LIMIT 1;
✅ Stage history created: SELECT * FROM deal_stage_history ORDER BY created_at DESC LIMIT 1;
✅ Activity logged: SELECT * FROM activity_log WHERE action = 'deal_created' ORDER BY created_at DESC LIMIT 1;

`);

// Run the test
testDealWebhook();
