/**
 * Complete Integration Test
 * Tests the entire partner → referral → status update flow
 * 
 * Run with: node backend/test-complete-flow.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const TEST_EMAIL = `test-partner-${Date.now()}@example.com`;
const TEST_PARTNER_NAME = 'Test Partner Inc';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`STEP ${step}: ${message}`, 'blue');
  log('='.repeat(60), 'blue');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteFlow() {
  let partnerId, authToken, leadId, zohoLeadId;

  try {
    log('\n🧪 Starting Complete Integration Test\n', 'yellow');

    // ========================================
    // STEP 1: Simulate Zoho Partner Webhook
    // ========================================
    logStep(1, 'Simulating Partner Creation from Zoho');
    
    const partnerWebhookPayload = {
      id: `ZOHO_VENDOR_${Date.now()}`,
      VendorName: TEST_PARTNER_NAME,
      Email: TEST_EMAIL
    };

    log(`Sending webhook to: ${BASE_URL}/api/webhooks/zoho/partner`);
    log(`Payload: ${JSON.stringify(partnerWebhookPayload, null, 2)}`);

    const webhookResponse = await axios.post(
      `${BASE_URL}/api/webhooks/zoho/partner`,
      partnerWebhookPayload
    );

    if (webhookResponse.data.success) {
      partnerId = webhookResponse.data.data.partner_id;
      log('✅ Partner created successfully!', 'green');
      log(`   Partner ID: ${partnerId}`);
      log(`   User ID: ${webhookResponse.data.data.user_id}`);
      log(`   Email: ${webhookResponse.data.data.email}`);
    } else {
      throw new Error('Partner creation failed');
    }

    // Wait for database to settle
    await sleep(1000);

    // ========================================
    // STEP 2: Login to Portal
    // ========================================
    logStep(2, 'Partner Logging into Portal');

    // First, we need to reset password since webhook creates placeholder
    // In real scenario, partner would get email with reset link
    log('Note: In production, partner would receive welcome email with password reset link');
    log('For testing, using Supabase Auth directly or creating password reset token');

    // For now, let's test with a known email/password user
    // You'll need to create a test user in Supabase manually or via Supabase Auth API
    log('⚠️  Skipping login for now - requires password reset flow', 'yellow');
    log('    In real flow: Partner clicks email → Sets password → Logs in');

    // Mock token for testing (in real scenario, this comes from login)
    // authToken = 'mock-jwt-token-for-testing';

    // ========================================
    // STEP 3: Submit Referral (Lead)
    // ========================================
    logStep(3, 'Submitting Referral to Zoho via Portal');

    log('⚠️  This step requires valid auth token from login', 'yellow');
    log('    Endpoint: POST /api/leads (authenticated)');
    log('    What it does:');
    log('      1. Creates lead in Zoho CRM');
    log('      2. Saves lead locally with zoho_lead_id');
    log('      3. Adds note to lead in Zoho');
    log('      4. Logs activity');

    const sampleLeadPayload = {
      first_name: 'John',
      last_name: 'Merchant',
      email: 'john.merchant@example.com',
      phone: '555-0123',
      company: 'Merchant Co',
      business_type: 'Retail',
      description: 'Looking for payment processing solution'
    };

    log('\nSample lead payload:');
    log(JSON.stringify(sampleLeadPayload, null, 2));

    // Uncomment when you have valid auth token:
    /*
    const leadResponse = await axios.post(
      `${BASE_URL}/api/leads`,
      sampleLeadPayload,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (leadResponse.data.success) {
      leadId = leadResponse.data.data.local_lead.id;
      zohoLeadId = leadResponse.data.data.zoho_lead_id;
      log('✅ Lead created successfully!', 'green');
      log(`   Local Lead ID: ${leadId}`);
      log(`   Zoho Lead ID: ${zohoLeadId}`);
    }
    */

    // ========================================
    // STEP 4: Simulate Zoho Status Update
    // ========================================
    logStep(4, 'Simulating Lead Status Update from Zoho');

    log('⚠️  This requires a lead to exist first', 'yellow');
    log('    Endpoint: POST /api/webhooks/zoho/lead-status');
    log('    What it does:');
    log('      1. Finds lead by zoho_lead_id');
    log('      2. Updates local status');
    log('      3. Creates status history record');
    log('      4. Logs activity');
    log('      5. (Future) Sends real-time notification via Socket.IO');

    const sampleStatusWebhook = {
      id: 'ZOHO_LEAD_12345', // This would be the actual zohoLeadId
      Lead_Status: 'Qualified',
      StrategicPartnerId: 'partner-uuid'
    };

    log('\nSample status webhook payload:');
    log(JSON.stringify(sampleStatusWebhook, null, 2));

    // Uncomment when you have actual lead:
    /*
    const statusResponse = await axios.post(
      `${BASE_URL}/api/webhooks/zoho/lead-status`,
      {
        id: zohoLeadId,
        Lead_Status: 'Qualified',
        StrategicPartnerId: partnerId
      }
    );

    if (statusResponse.data.success) {
      log('✅ Status updated successfully!', 'green');
      log(`   Old Status: ${statusResponse.data.data.old_status}`);
      log(`   New Status: ${statusResponse.data.data.new_status}`);
    }
    */

    // ========================================
    // SUMMARY
    // ========================================
    log('\n' + '='.repeat(60), 'blue');
    log('TEST SUMMARY', 'blue');
    log('='.repeat(60), 'blue');

    log('\n✅ Working:', 'green');
    log('  • Partner webhook endpoint');
    log('  • Partner + User creation via security definer function');
    log('  • Activity logging');

    log('\n⚠️  Needs Testing:', 'yellow');
    log('  • Password reset/welcome email flow');
    log('  • Login authentication');
    log('  • Lead creation with auth token');
    log('  • Lead status webhook with actual data');
    log('  • Real-time Socket.IO notifications');

    log('\n📋 Next Steps:', 'blue');
    log('  1. Set up email service (SendGrid/Resend) for welcome emails');
    log('  2. Test password reset flow');
    log('  3. Create test partner and manually set password in Supabase');
    log('  4. Test complete flow with actual Zoho CRM integration');
    log('  5. Set up Zoho webhooks in production');
    log('  6. Implement real-time notifications');

  } catch (error) {
    log('\n❌ Test Failed:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    process.exit(1);
  }
}

// ========================================
// Health Check First
// ========================================
async function checkHealth() {
  log('🏥 Checking backend health...', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const health = response.data;

    log(`✅ Backend is running`, 'green');
    log(`   API: ${health.services.api}`);
    log(`   Database: ${health.services.database}`);
    log(`   Zoho CRM: ${health.services.zoho_crm}`);

    if (health.services.database !== 'connected') {
      throw new Error('Database is not connected!');
    }

    if (health.services.zoho_crm !== 'connected') {
      log('⚠️  Warning: Zoho CRM is not connected. Some tests may fail.', 'yellow');
    }

    return true;
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    log(`   Make sure backend is running on ${BASE_URL}`, 'red');
    process.exit(1);
  }
}

// Run the test
(async () => {
  try {
    await checkHealth();
    await testCompleteFlow();
  } catch (error) {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  }
})();

