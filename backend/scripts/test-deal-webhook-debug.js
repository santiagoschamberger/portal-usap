/**
 * Debug script for testing the deal webhook
 * This helps us see exactly what data Zoho sends and how our webhook processes it
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://usapayments-portal-20-production.up.railway.app';
const WEBHOOK_ENDPOINT = `${BACKEND_URL}/api/webhooks/zoho/deal`;

// Test scenarios
const testScenarios = [
  {
    name: "Main Partner Creates Deal",
    description: "Deal created by main partner account",
    data: {
      id: "5725767000001234567",
      Deal_Name: "Test Deal - Main Partner",
      Stage: "Qualification", 
      Lead_Source: "Website",
      Business_Name: "ABC Corp",
      Contact_First_Name: "John",
      Contact_Name: "John Doe",
      Partners_Id: "5577028000042584185" // Santiago Schamberger 2.0 partner
    }
  },
  {
    name: "Sub-Account Creates Deal", 
    description: "Deal created by sub-account (this is the tricky case)",
    data: {
      id: "5725767000001234568",
      Deal_Name: "Test Deal - Sub Account",
      Stage: "Qualification",
      Lead_Source: "Strategic Partner", 
      Business_Name: "XYZ Corp",
      Contact_First_Name: "Jane",
      Contact_Name: "Jane Smith",
      Partners_Id: "5577028000042584185", // Same partner
      // We need a field here that contains the actual sub-account user ID
      // Something like: Strategic_Partner_User_Id: "REPLACE_WITH_SUB_ACCOUNT_USER_ID"
    }
  }
];

async function testWebhook(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  console.log(`📦 Payload:`, JSON.stringify(scenario.data, null, 2));
  
  try {
    const response = await axios.post(WEBHOOK_ENDPOINT, scenario.data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(`🎉 SUCCESS!`);
      console.log(`💡 Deal ID: ${response.data.data?.deal_id}`);
      console.log(`💡 Partner ID: ${response.data.data?.partner_id}`);
      console.log(`💡 Created By: ${response.data.data?.created_by}`);
      
      // Check what user this maps to
      if (response.data.data?.created_by) {
        console.log(`🔍 This deal will show as "Submitted by" the user with ID: ${response.data.data.created_by}`);
      }
    } else {
      console.log(`❌ FAILED: ${response.data.error || response.data.message}`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR:`, error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log(`
🔧 Deal Webhook Debug Script
============================

This script tests the deal webhook to see:
1. What data Zoho sends
2. How our webhook processes it  
3. Which user gets credited as "created_by"

SETUP REQUIRED:
1. Replace 'REPLACE_WITH_REAL_PARTNER_ZOHO_ID' with actual partner Zoho ID
2. Make sure your backend is running
3. Check your database after running tests

Expected Issue:
- Both scenarios will probably show the same "created_by" (main partner)
- We need a way to distinguish between main partner vs sub-account submissions

`);

  for (const scenario of testScenarios) {
    await testWebhook(scenario);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log(`
📊 After running tests, check your database:

-- See what deals were created
SELECT 
  id,
  deal_name,
  partner_id,
  created_by,
  stage,
  zoho_deal_id
FROM deals 
ORDER BY created_at DESC 
LIMIT 5;

-- See which users these map to
SELECT 
  d.deal_name,
  d.created_by,
  u.email,
  u.role,
  u.first_name,
  u.last_name
FROM deals d
LEFT JOIN users u ON u.id = d.created_by
ORDER BY d.created_at DESC 
LIMIT 5;

🚨 EXPECTED PROBLEM:
Both deals will probably show the same created_by user (main partner).
We need to add a field in Zoho that tracks the actual submitting user.

💡 SOLUTION:
Add a custom field in Zoho Deals called something like:
- "Strategic_Partner_User_Id" 
- "Submitted_By_User_Id"
- "Original_Lead_Creator"

This field should contain the portal user ID of whoever created the original lead.
`);
}

// Instructions
console.log(`
📋 SETUP INSTRUCTIONS:

1. Update the Partners_Id values:
   - Query your database: SELECT zoho_partner_id FROM partners WHERE approved = true LIMIT 1;
   - Replace 'REPLACE_WITH_REAL_PARTNER_ZOHO_ID' with the actual value

2. Run the test:
   node backend/scripts/test-deal-webhook-debug.js

3. Check the results to see the attribution issue

4. If needed, we'll create a custom field in Zoho to track the actual submitter
`);

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { testWebhook, testScenarios };
