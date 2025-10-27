const axios = require('axios');
require('dotenv').config();

async function testDirect() {
  console.log('🔍 Direct Zoho API Test\n');
  
  // Test 1: Get Access Token
  console.log('Step 1: Getting access token...');
  try {
    const tokenResponse = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      },
    });
    
    console.log('✅ Access token obtained!');
    console.log('Token:', tokenResponse.data.access_token.substring(0, 20) + '...');
    console.log('Expires in:', tokenResponse.data.expires_in, 'seconds\n');
    
    const accessToken = tokenResponse.data.access_token;
    
    // Test 2: Get Organization Info
    console.log('Step 2: Testing API connectivity...');
    const orgResponse = await axios.get('https://www.zohoapis.com/crm/v2/org', {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Successfully connected to Zoho CRM!');
    console.log('Organization:', orgResponse.data.org[0].company_name);
    console.log('\n🎉 All tests passed!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testDirect();
