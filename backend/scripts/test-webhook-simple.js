/**
 * Simple webhook connectivity test
 */

const axios = require('axios');

async function testWebhookConnectivity() {
  const baseUrl = 'https://usapayments-portal-20-production.up.railway.app';
  
  console.log('🔍 Testing Railway Backend Connectivity...\n');
  
  // Test 1: Health check
  try {
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/health`, { timeout: 10000 });
    console.log(`✅ Health check: ${healthResponse.status} - ${JSON.stringify(healthResponse.data)}`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.response?.status || error.code} - ${error.response?.data || error.message}`);
  }
  
  // Test 2: Basic webhook endpoint
  try {
    console.log('\n2️⃣ Testing deal webhook endpoint...');
    const webhookResponse = await axios.post(`${baseUrl}/api/webhooks/zoho/deal`, {
      test: true,
      id: "test-123"
    }, { 
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`✅ Webhook test: ${webhookResponse.status} - ${JSON.stringify(webhookResponse.data)}`);
  } catch (error) {
    console.log(`❌ Webhook test failed: ${error.response?.status || error.code}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
  
  // Test 3: Check if it's a CORS issue
  try {
    console.log('\n3️⃣ Testing with different headers...');
    const corsResponse = await axios.post(`${baseUrl}/api/webhooks/zoho/deal`, {
      id: "5725767000001234567",
      Deal_Name: "Test Deal",
      Stage: "Qualification",
      Partners_Id: "5577028000042584185"
    }, { 
      timeout: 10000,
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Zoho-Webhook/1.0'
      }
    });
    console.log(`✅ CORS test: ${corsResponse.status} - ${JSON.stringify(corsResponse.data)}`);
  } catch (error) {
    console.log(`❌ CORS test failed: ${error.response?.status || error.code}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
    }
  }
  
  console.log(`
📊 DIAGNOSIS:

If health check fails:
- Railway deployment might be down or not fully deployed
- Check Railway dashboard for deployment status

If webhook fails with 404:
- Route might not be registered correctly
- Check backend/src/index.ts for webhook route mounting

If webhook fails with 500:
- Database connection or logic error
- Check Railway logs for detailed error

💡 NEXT STEPS:
1. Check Railway deployment status
2. If deployed, check Railway logs for errors
3. Verify webhook route is properly mounted in Express app
`);
}

testWebhookConnectivity();
