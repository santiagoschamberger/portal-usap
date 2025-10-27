const { zohoService } = require('./src/services/zohoService');

async function testZohoService() {
  console.log('🧪 Testing Zoho CRM Service...\n');
  
  try {
    // Test 1: Get access token
    console.log('1. Testing access token generation...');
    const token = await zohoService.getAccessToken();
    console.log('✅ Access token obtained:', token.slice(0, 20) + '...\n');

    // Test 2: Get partner leads (this will fail without a real partner ID, but tests API call)
    console.log('2. Testing partner leads fetch...');
    try {
      const leads = await zohoService.getPartnerLeads('test-partner-id');
      console.log('✅ Partner leads response:', leads);
    } catch (error) {
      console.log('ℹ️  Expected error for test partner ID:', error.message.slice(0, 100) + '...\n');
    }

    // Test 3: Test validation
    console.log('3. Testing configuration validation...');
    zohoService.validateConfig();
    console.log('✅ Configuration validation passed!\n');

    console.log('🎉 All Zoho tests completed!');
  } catch (error) {
    console.error('❌ Zoho test failed:', error.message);
  }
}

testZohoService();